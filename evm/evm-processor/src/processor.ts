import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, def, runProgram} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {Database, getOrGenerateSquidId, PrometheusServer, Runner} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest} from '@subsquid/util-internal-range'
import {cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {EvmArchive} from './ds-archive/client'
import {EvmRpcDataSource} from './ds-rpc/client'
import {Chain} from './interfaces/chain'
import {BlockData, DEFAULT_FIELDS, FieldSelection} from './interfaces/data'
import {DataRequest, LogRequest, StateDiffRequest, TraceRequest, TransactionRequest} from './interfaces/data-request'
import {getFieldSelectionValidator} from './mapping/selection'


export interface RpcEndpointSettings {
    /**
     * RPC endpoint URL (either http(s) or ws(s))
     */
    url: string
    /**
     * Maximum number of ongoing concurrent requests
     */
    capacity?: number
    /**
     * Maximum number of requests per second
     */
    rateLimit?: number
    /**
     * Request timeout in `ms`
     */
    requestTimeout?: number
    /**
     * Maximum number of requests in a single batch call
     */
    maxBatchCallSize?: number
    /**
     * HTTP headers
     */
    headers?: Record<string, string>
}


export interface RpcDataIngestionSettings {
    /**
     * By default, `debug_traceBlockByHash` is used to obtain call traces,
     * this flag instructs the processor to utilize `trace_` methods instead.
     *
     * This setting is only effective for finalized blocks.
     */
    preferTraceApi?: boolean
    /**
     * By default, `trace_replayBlockTransactions` is used to obtain state diffs for finalized blocks,
     * this flag instructs the processor to utilize `debug_traceBlockByHash` instead.
     *
     * This setting is only effective for finalized blocks.
     */
    useDebugApiForStateDiffs?: boolean
    /**
     * Pass `timeout` parameter to [debug trace config](https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-debug#traceconfig)
     *
     * E.g. `debugTraceTimeout: "20s"`
     */
    debugTraceTimeout?: string
    /**
     * Poll interval for new blocks in `ms`
     *
     * Poll mechanism is used to get new blocks via HTTP connection.
     */
    headPollInterval?: number
    /**
     * When websocket subscription is used to get new blocks,
     * this setting specifies timeout in `ms` after which connection
     * will be reset and subscription re-initiated if no new block where received.
     */
    newHeadTimeout?: number
    /**
     * Disable RPC data ingestion entirely
     */
    disabled?: boolean
}


export interface GatewaySettings {
    /**
     * Subsquid Network Gateway url
     */
    url: string
    /**
     * Request timeout in ms
     */
    requestTimeout?: number
}


/**
 * @deprecated
 */
export type ArchiveSettings = GatewaySettings


/**
 * @deprecated
 */
export type DataSource = ArchiveDataSource | ChainDataSource



interface ArchiveDataSource {
    /**
     * Subsquid evm archive endpoint URL
     */
    archive: string | GatewaySettings
    /**
     * Chain node RPC endpoint URL
     */
    chain?: string | RpcEndpointSettings
}


interface ChainDataSource {
    archive?: undefined
    /**
     * Chain node RPC endpoint URL
     */
    chain: string | RpcEndpointSettings
}


interface BlockRange {
    /**
     * Block range
     */
    range?: Range
}


/**
 * API and data that is passed to the data handler
 */
export interface DataHandlerContext<Store, F extends FieldSelection = {}> {
    /**
     * @internal
     */
    _chain: Chain
    /**
     * An instance of a structured logger.
     */
    log: Logger
    /**
     * Storage interface provided by the database
     */
    store: Store
    /**
     * List of blocks to map and process
     */
    blocks: BlockData<F>[]
    /**
     * Signals, that the processor reached the head of a chain.
     *
     * The head block is always included in `.blocks`.
     */
    isHead: boolean
}


export type EvmBatchProcessorFields<T> = T extends EvmBatchProcessor<infer F> ? F : never


/**
 * Provides methods to configure and launch data processing.
 */
export class EvmBatchProcessor<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private blockRange?: Range
    private fields?: FieldSelection
    private finalityConfirmation?: number
    private archive?: GatewaySettings
    private rpcIngestSettings?: RpcDataIngestionSettings
    private rpcEndpoint?: RpcEndpointSettings
    private running = false

    /**
     * @deprecated Use {@link .setGateway()}
     */
    setArchive(url: string | GatewaySettings): this {
        return this.setGateway(url)
    }

    /**
     * Set Subsquid Network Gateway endpoint (ex Archive).
     *
     * Subsquid Network allows to get data from finalized blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * processor.setGateway('https://v2.archive.subsquid.io/network/ethereum-mainnet')
     */
    setGateway(url: string | GatewaySettings): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.archive = {url}
        } else {
            this.archive = url
        }
        return this
    }

    /**
     * Set chain RPC endpoint
     *
     * @example
     * // just pass a URL
     * processor.setRpcEndpoint('https://eth-mainnet.public.blastapi.io')
     *
     * // adjust some connection options
     * processor.setRpcEndpoint({
     *     url: 'https://eth-mainnet.public.blastapi.io',
     *     rateLimit: 10
     * })
     */
    setRpcEndpoint(url: string | RpcEndpointSettings | undefined): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.rpcEndpoint = {url}
        } else {
            this.rpcEndpoint = url
        }
        return this
    }

    /**
     * Sets blockchain data source.
     *
     * @example
     * processor.setDataSource({
     *     archive: 'https://v2.archive.subsquid.io/network/ethereum-mainnet',
     *     chain: 'https://eth-mainnet.public.blastapi.io'
     * })
     *
     * @deprecated Use separate {@link .setGateway()} and {@link .setRpcEndpoint()} methods
     * to specify data sources.
     */
    setDataSource(src: DataSource): this {
        this.assertNotRunning()
        if (src.archive) {
            this.setGateway(src.archive)
        } else {
            this.archive = undefined
        }
        if (src.chain) {
            this.setRpcEndpoint(src.chain)
        } else {
            this.rpcEndpoint = undefined
        }
        return this
    }

    /**
     * Set up RPC data ingestion settings
     */
    setRpcDataIngestionSettings(settings: RpcDataIngestionSettings): this {
        this.assertNotRunning()
        this.rpcIngestSettings = settings
        return this
    }

    /**
     * @deprecated Use {@link .setRpcDataIngestionSettings()} instead
     */
    setChainPollInterval(ms: number): this {
        assert(ms >= 0)
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, headPollInterval: ms}
        return this
    }

    /**
     * @deprecated Use {@link .setRpcDataIngestionSettings()} instead
     */
    preferTraceApi(yes?: boolean): this {
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, preferTraceApi: yes !== false}
        return this
    }

    /**
     * @deprecated Use {@link .setRpcDataIngestionSettings()} instead
     */
    useDebugApiForStateDiffs(yes?: boolean): this {
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, useDebugApiForStateDiffs: yes !== false}
        return this
    }

    /**
     * Never use RPC endpoint for data ingestion.
     *
     * @deprecated This is the same as `.setRpcDataIngestionSettings({disabled: true})`
     */
    useArchiveOnly(yes?: boolean): this {
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, disabled: yes !== false}
        return this
    }

    /**
     * Distance from the head block behind which all blocks are considered to be finalized.
     */
    setFinalityConfirmation(nBlocks: number): this {
        this.assertNotRunning()
        this.finalityConfirmation = nBlocks
        return this
    }

    /**
     * Configure a set of fetched fields
     */
    setFields<T extends FieldSelection>(fields: T): EvmBatchProcessor<T> {
        this.assertNotRunning()
        let validator = getFieldSelectionValidator()
        this.fields = cast(validator, fields)
        return this as any
    }

    private add(request: DataRequest, range?: Range): void {
        this.requests.push({
            range: range || {from: 0},
            request
        })
    }

    /**
     * By default, the processor will fetch only blocks
     * which contain requested items. This method
     * modifies such behaviour to fetch all chain blocks.
     *
     * Optionally a range of blocks can be specified
     * for which the setting should be effective.
     */
    includeAllBlocks(range?: Range): this {
        this.assertNotRunning()
        this.add({includeAllBlocks: true}, range)
        return this
    }

    addLog(options: LogRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({
            logs: [mapRequest(options)]
        }, options.range)
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({
            transactions: [mapRequest(options)]
        }, options.range)
        return this
    }

    addTrace(options: TraceRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({
            traces: [mapRequest(options)]
        }, options.range)
        return this
    }

    addStateDiff(options: StateDiffRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({
            stateDiffs: [mapRequest(options)]
        }, options.range)
        return this
    }

    /**
     * Limits the range of blocks to be processed.
     *
     * When the upper bound is specified,
     * the processor will terminate with exit code 0 once it reaches it.
     */
    setBlockRange(range?: Range): this {
        this.assertNotRunning()
        this.blockRange = range
        return this
    }

    /**
     * Sets the port for a built-in prometheus metrics server.
     *
     * By default, the value of `PROMETHEUS_PORT` environment
     * variable is used. When it is not set,
     * the processor will pick up an ephemeral port.
     */
    setPrometheusPort(port: number | string): this {
        this.assertNotRunning()
        this.getPrometheusServer().setPort(port)
        return this
    }

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }

    @def
    private getPrometheusServer(): PrometheusServer {
        return new PrometheusServer()
    }

    @def
    private getChainRpcClient(): RpcClient {
        if (this.rpcEndpoint == null) {
            throw new Error(`use .setRpcEndpoint() to specify chain RPC endpoint`)
        }
        let client = new RpcClient({
            url: this.rpcEndpoint.url,
            headers: this.rpcEndpoint.headers,
            maxBatchCallSize: this.rpcEndpoint.maxBatchCallSize ?? 100,
            requestTimeout:  this.rpcEndpoint.requestTimeout ?? 30_000,
            capacity: this.rpcEndpoint.capacity ?? 10,
            rateLimit: this.rpcEndpoint.rateLimit,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            log: this.getLogger().child('rpc', {rpcUrl: this.rpcEndpoint.url})
        })
        this.getPrometheusServer().addChainRpcMetrics(() => client.getMetrics())
        return client
    }

    @def
    private getChain(): Chain {
        let self = this
        return {
            get client() {
                return self.getChainRpcClient()
            }
        }
    }

    @def
    private getHotDataSource(): EvmRpcDataSource {
        if (this.finalityConfirmation == null) {
            throw new Error(`use .setFinalityConfirmation() to specify number of children required to confirm block's finality`)
        }
        return new EvmRpcDataSource({
            rpc: this.getChainRpcClient(),
            finalityConfirmation: this.finalityConfirmation,
            preferTraceApi: this.rpcIngestSettings?.preferTraceApi,
            useDebugApiForStateDiffs: this.rpcIngestSettings?.useDebugApiForStateDiffs,
            debugTraceTimeout: this.rpcIngestSettings?.debugTraceTimeout,
            headPollInterval: this.rpcIngestSettings?.headPollInterval,
            newHeadTimeout: this.rpcIngestSettings?.newHeadTimeout,
            log: this.getLogger().child('rpc', {rpcUrl: this.getChainRpcClient().url})
        })
    }

    @def
    private getArchiveDataSource(): EvmArchive {
        let archive = assertNotNull(this.archive)

        let log = this.getLogger().child('archive')

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent: new HttpAgent({
                keepAlive: true
            }),
            log
        })

        return new EvmArchive(
            new ArchiveClient({
                http,
                url: archive.url,
                queryTimeout: archive.requestTimeout,
                log
            })
        )
    }

    @def
    private getBatchRequests(): RangeRequest<DataRequest>[] {
        let requests = mergeRangeRequests(this.requests, function merge(a: DataRequest, b: DataRequest) {
            let res: DataRequest = {}
            if (a.includeAllBlocks || b.includeAllBlocks) {
                res.includeAllBlocks = true
            }
            res.transactions = concatRequestLists(a.transactions, b.transactions)
            res.logs = concatRequestLists(a.logs, b.logs)
            res.traces = concatRequestLists(a.traces, b.traces)
            res.stateDiffs = concatRequestLists(a.stateDiffs, b.stateDiffs)
            return res
        })

        let fields = addDefaultFields(this.fields)
        for (let req of requests) {
            req.request.fields = fields
        }

        return applyRangeBound(requests, this.blockRange)
    }

    /**
     * Run data processing.
     *
     * This method assumes full control over the current OS process as
     * it terminates the entire program in case of error or
     * at the end of data processing.
     *
     * @param database - database is responsible for providing storage to data handlers
     * and persisting mapping progress and status.
     *
     * @param handler - The data handler, see {@link DataHandlerContext} for an API available to the handler.
     */
    run<Store>(database: Database<Store>, handler: (ctx: DataHandlerContext<Store, F>) => Promise<void>): void {
        this.assertNotRunning()
        this.running = true
        let log = this.getLogger()

        runProgram(async () => {
            let chain = this.getChain()
            let mappingLog = log.child('mapping')

            if (this.archive == null && this.rpcEndpoint == null) {
                throw new Error(
                    'No data source where specified. ' +
                    'Use .setArchive() to specify Subsquid Archive and/or .setRpcEndpoint() to specify RPC endpoint.'
                )
            }

            if (this.archive == null && this.rpcIngestSettings?.disabled) {
                throw new Error('Subsquid Archive is required when RPC data ingestion is disabled')
            }

            return new Runner({
                database,
                requests: this.getBatchRequests(),
                archive: this.archive ? this.getArchiveDataSource() : undefined,
                hotDataSource: this.rpcEndpoint && !this.rpcIngestSettings?.disabled
                    ? this.getHotDataSource()
                    : undefined,
                allBlocksAreFinal: this.finalityConfirmation === 0,
                prometheus: this.getPrometheusServer(),
                log,
                process(store, batch) {
                    return handler({
                        _chain: chain,
                        log: mappingLog,
                        store,
                        blocks: batch.blocks as any,
                        isHead: batch.isHead
                    })
                }
            }).run()
        }, err => log.fatal(err))
    }
}


function mapRequest<T extends BlockRange>(options: T): Omit<T, 'range'> {
    let {range, ...req} = options
    for (let key in req) {
        let val = (req as any)[key]
        if (Array.isArray(val)) {
            (req as any)[key] = val.map(s => s.toLowerCase())
        }
    }
    return req
}


function concatRequestLists<T extends object>(a?: T[], b?: T[]): T[] | undefined {
    let result: T[] = []
    if (a) {
        result.push(...a)
    }
    if (b) {
        result.push(...b)
    }
    return result.length == 0 ? undefined : result
}


function addDefaultFields(fields?: FieldSelection): FieldSelection {
    return {
        block: mergeDefaultFields(DEFAULT_FIELDS.block, fields?.block),
        transaction: mergeDefaultFields(DEFAULT_FIELDS.transaction, fields?.transaction),
        log: mergeDefaultFields(DEFAULT_FIELDS.log, fields?.log),
        trace: mergeDefaultFields(DEFAULT_FIELDS.trace, fields?.trace),
        stateDiff: {...mergeDefaultFields(DEFAULT_FIELDS.stateDiff, fields?.stateDiff), kind: true}
    }
}


type Selector<Props extends string> = {
    [P in Props]?: boolean
}


function mergeDefaultFields<Props extends string>(
    defaults: Selector<Props>,
    selection?: Selector<Props>
): Selector<Props> {
    let result: Selector<Props> = {...defaults}
    for (let key in selection) {
        if (selection[key] != null) {
            if (selection[key]) {
                result[key] = true
            } else {
                delete result[key]
            }
        }
    }
    return result
}
