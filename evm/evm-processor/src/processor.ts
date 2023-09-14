import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, def, runProgram} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {
    applyRangeBound,
    Database,
    getOrGenerateSquidId,
    mergeRangeRequests,
    PrometheusServer,
    Range,
    RangeRequest,
    Runner
} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {EvmArchive} from './ds-archive/client'
import {EvmRpcDataSource} from './ds-rpc/client'
import {Chain} from './interfaces/chain'
import {BlockData, FieldSelection} from './interfaces/data'
import {DataRequest, LogRequest, StateDiffRequest, TraceRequest, TransactionRequest} from './interfaces/data-request'


export type DataSource = ArchiveDataSource | ChainDataSource


type ChainRpc = string | {
    url: string
    capacity?: number
    rateLimit?: number
    requestTimeout?: number
    maxBatchCallSize?: number
}


type ArchiveConnection = string | {
    url: string
    requestTimeout?: number
}


interface ArchiveDataSource {
    /**
     * Subsquid evm archive endpoint URL
     */
    archive: ArchiveConnection
    /**
     * Chain node RPC endpoint URL
     */
    chain?: ChainRpc
}


interface ChainDataSource {
    archive?: undefined
    /**
     * Chain node RPC endpoint URL
     */
    chain: ChainRpc
}


interface BlockRange {
    /**
     * Block range
     */
    range?: Range
}


export interface DataHandlerContext<Store, F extends FieldSelection = {}> {
    _chain: Chain
    log: Logger
    store: Store
    blocks: BlockData<F>[]
    isHead: boolean
}


export type EvmBatchProcessorFields<T> = T extends EvmBatchProcessor<infer F> ? F : never


/**
 * Provides methods to configure and launch data processing.
 */
export class EvmBatchProcessor<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private src?: DataSource
    private blockRange?: Range
    private fields?: FieldSelection
    private finalityConfirmation?: number
    private _preferTraceApi?: boolean
    private _useDebugApiForStateDiffs?: boolean
    private _useArchiveOnly?: boolean
    private chainPollInterval?: number
    private running = false

    private add(request: DataRequest, range?: Range): void {
        this.requests.push({
            range: range || {from: 0},
            request
        })
    }

    /**
     * Configure a set of fetched fields
     */
    setFields<T extends FieldSelection>(fields: T): EvmBatchProcessor<T> {
        this.assertNotRunning()
        this.fields = fields
        return this as any
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
     * Sets blockchain data source.
     *
     * @example
     * processor.setDataSource({
     *     archive: 'https://v2.archive.subsquid.io/network/ethereum-mainnet',
     *     chain: 'https://eth-mainnet.public.blastapi.io'
     * })
     */
    setDataSource(src: DataSource): this {
        this.assertNotRunning()
        this.src = src
        return this
    }

    setFinalityConfirmation(nBlocks: number): this {
        this.assertNotRunning()
        this.finalityConfirmation = nBlocks
        return this
    }

    setChainPollInterval(ms: number): this {
        assert(ms >= 0)
        this.assertNotRunning()
        this.chainPollInterval = ms
        return this
    }

    preferTraceApi(yes?: boolean): this {
        this.assertNotRunning()
        this._preferTraceApi = yes !== false
        return this
    }

    useDebugApiForStateDiffs(yes?: boolean): this {
        this.assertNotRunning()
        this._useDebugApiForStateDiffs = yes !== false
        return this
    }

    useArchiveOnly(yes?: boolean): this {
        this.assertNotRunning()
        this._useArchiveOnly = yes !== false
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

    private getDataSource(): DataSource {
        if (this.src == null) {
            throw new Error('use .setDataSource() to specify archive and/or chain RPC endpoint')
        }
        return this.src
    }

    @def
    private getChainRpcClient(): RpcClient {
        let options = this.src?.chain
        if (options == null) {
            throw new Error(`use .setDataSource() to specify chain RPC endpoint`)
        }
        if (typeof options == 'string') {
            options = {url: options}
        }
        let client = new RpcClient({
            url: options.url,
            maxBatchCallSize: options.maxBatchCallSize ?? 100,
            requestTimeout:  options.requestTimeout ?? 30_000,
            capacity: options.capacity ?? 10,
            rateLimit: options.rateLimit,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            log: this.getLogger().child('rpc', {rpcUrl: options.url})
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
            preferTraceApi: this._preferTraceApi,
            useDebugApiForStateDiffs: this._useDebugApiForStateDiffs,
            pollInterval: this.chainPollInterval,
            log: this.getLogger().child('rpc', {rpcUrl: this.getChainRpcClient().url})
        })
    }

    @def
    private getArchiveDataSource(): EvmArchive {
        let archive = assertNotNull(this.getDataSource().archive)
        if (typeof archive == 'string') {
            archive = {url: archive}
        }

        let log = this.getLogger().child('archive')

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent: new HttpAgent({
                keepAlive: true
            }),
            log: log.child('http')
        })

        return new EvmArchive(
            new ArchiveClient({
                http,
                log,
                url: archive.url,
                queryTimeout: archive.requestTimeout
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

        if (this.fields) {
            requests.forEach(req => {
                req.request.fields = this.fields
            })
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
     * @param handler - The data handler, see {@link BatchContext} for an API available to the handler.
     */
    run<Store>(database: Database<Store>, handler: (ctx: DataHandlerContext<Store, F>) => Promise<void>): void {
        this.assertNotRunning()
        this.running = true
        let log = this.getLogger()

        runProgram(async () => {
            let src = this.getDataSource()
            let chain = this.getChain()
            let mappingLog = log.child('mapping')

            if (src.archive == null && this._useArchiveOnly) {
                throw new Error('Archive URL is required when .useArchiveOnly() flag is set')
            }

            return new Runner({
                database,
                requests: this.getBatchRequests(),
                archive: src.archive ? this.getArchiveDataSource() : undefined,
                hotDataSource: src.chain && !this._useArchiveOnly ? this.getHotDataSource() : undefined,
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
