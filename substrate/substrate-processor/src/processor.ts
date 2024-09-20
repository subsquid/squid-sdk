import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {
    getOldTypesBundle,
    OldSpecsBundle,
    OldTypesBundle,
    readOldTypesBundle
} from '@subsquid/substrate-runtime/lib/metadata'
import {
    eliminatePolkadotjsTypesBundle,
    PolkadotjsTypesBundle
} from '@subsquid/substrate-runtime/lib/metadata/old/typesBundle-polkadotjs'
import {assertNotNull, def, runProgram} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {Batch, Database, getOrGenerateSquidId, PrometheusServer, Runner} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest} from '@subsquid/util-internal-range'
import {cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {Chain} from './chain'
import {SubstrateArchive} from './ds-archive'
import {RpcDataSource} from './ds-rpc'
import {Block, FieldSelection} from './interfaces/data'
import {
    CallRequest,
    ContractsContractEmittedRequest,
    DataRequest,
    EthereumTransactRequest,
    EventRequest,
    EvmLogRequest,
    GearMessageQueuedRequest,
    GearUserMessageSentRequest
} from './interfaces/data-request'
import {getFieldSelectionValidator} from './selection'


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
export interface DataSource {
    /**
     * Subsquid archive endpoint URL
     */
    archive?: string
    /**
     * Chain node RPC endpoint URL
     */
    chain: string | RpcEndpointSettings
}


interface BlockRange {
    range?: Range
}


/**
 * API and data that is passed to the data handler
 */
export interface DataHandlerContext<Store, Fields extends FieldSelection> {
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
    blocks: Block<Fields>[]
    /**
     * Signals, that the processor reached the head of a chain.
     *
     * The head block is always included in `.blocks`.
     */
    isHead: boolean
}


export type SubstrateBatchProcessorFields<T> = T extends SubstrateBatchProcessor<infer F> ? F : never


/**
 * Provides methods to configure and launch data processing.
 */
export class SubstrateBatchProcessor<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private finalityConfirmation?: number
    private archive?: GatewaySettings
    private rpcEndpoint?: RpcEndpointSettings
    private rpcIngestSettings?: RpcDataIngestionSettings
    private typesBundle?: OldTypesBundle | OldSpecsBundle
    private prometheus = new PrometheusServer()
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
     * processor.setGateway('https://v2.archive.subsquid.io/network/kusama')
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
     * processor.setRpcEndpoint('https://kusama-rpc.polkadot.io')
     *
     * // adjust some connection options
     * processor.setRpcEndpoint({
     *     url: 'https://kusama-rpc.polkadot.io',
     *     rateLimit: 10
     * })
     */
    setRpcEndpoint(url: string | RpcEndpointSettings): this {
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
     *     archive: 'https://v2.archive.subsquid.io/network/kusama',
     *     chain: 'https://kusama-rpc.polkadot.io'
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
     * Never use RPC endpoint for data ingestion.
     *
     * @deprecated This is the same as `.setRpcDataIngestionSettings({disabled: true})`
     */
    useArchiveOnly(yes?: boolean): this {
        this.assertNotRunning()
        this.rpcIngestSettings = {...this.rpcIngestSettings, disabled: true}
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
     * Distance from the head block behind which all blocks are considered to be finalized.
     *
     * By default, the processor will track finalized blocks via `chain_getFinalizedHead`.
     * Configure it only if `chain_getFinalizedHead` doesn’t return the expected info.
     */
    setFinalityConfirmation(nBlocks: number): this {
        this.assertNotRunning()
        this.finalityConfirmation = nBlocks
        return this
    }

    /**
     * Configure a set of fetched fields
     */
    setFields<T extends FieldSelection>(fields: T): SubstrateBatchProcessor<T> {
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

    addEvent(options: EventRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add({events: [req]}, range)
        return this
    }

    addCall(options: CallRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add({calls: [req]}, range)
        return this
    }

    addEvmLog(options: EvmLogRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, address, ...req} = options
        this.add({evmLogs: [{
            ...req,
            address: address?.map(s => s.toLowerCase())
        }]}, range)
        return this
    }

    addEthereumTransaction(options: EthereumTransactRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, to, ...req} = options
        this.add({ethereumTransactions: [{
            ...req,
            to: to?.map(s => s.toLowerCase())
        }]}, range)
        return this
    }

    addContractsContractEmitted(options: ContractsContractEmittedRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add({contractsEvents: [req]}, range)
        return this
    }

    addGearMessageQueued(options: GearMessageQueuedRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add({gearMessagesQueued: [req]}, range)
        return this
    }

    addGearUserMessageSent(options: GearUserMessageSentRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add({gearUserMessagesSent: [req]}, range)
        return this
    }

    /**
     * Sets types bundle.
     *
     * Types bundle is only required for blocks which have
     * metadata version below 14 and only if we don't have built-in
     * support for the chain in question.
     *
     * Subsquid project has its own types bundle format,
     * however, most of polkadotjs types bundles will work as well.
     *
     * Types bundle can be specified in 2 different ways:
     *
     * 1. as a name of a JSON file
     * 2. as an {@link OldTypesBundle} or {@link OldSpecsBundle} or {@link PolkadotjsTypesBundle} object
     *
     * @example
     * // A path to a JSON file resolved relative to `cwd`.
     * processor.setTypesBundle('typesBundle.json')
     *
     * // OldTypesBundle object
     * processor.setTypesBundle({
     *     types: {
     *         Foo: 'u8'
     *     }
     * })
     */
    setTypesBundle(bundle: string | OldTypesBundle | OldSpecsBundle | PolkadotjsTypesBundle): this {
        this.assertNotRunning()
        if (typeof bundle == 'string') {
            this.typesBundle = getOldTypesBundle(bundle) || readOldTypesBundle(bundle)
        } else {
            this.typesBundle = eliminatePolkadotjsTypesBundle(bundle)
        }
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
        this.prometheus.setPort(port)
        return this
    }

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
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
        this.prometheus.addChainRpcMetrics(() => client.getMetrics())
        return client
    }

    @def
    private getRpcDataSource(): RpcDataSource {
        return new RpcDataSource({
            rpc: this.getChainRpcClient(),
            headPollInterval: this.rpcIngestSettings?.headPollInterval,
            newHeadTimeout: this.rpcIngestSettings?.newHeadTimeout,
            typesBundle: this.typesBundle,
            finalityConfirmation: this.finalityConfirmation
        })
    }

    @def
    private getArchiveDataSource(): SubstrateArchive {
        let options = assertNotNull(this.archive)

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

        return new SubstrateArchive({
            client: new ArchiveClient({
                http,
                url: options.url,
                queryTimeout: options.requestTimeout,
                log
            }),
            rpc: this.getChainRpcClient(),
            typesBundle: this.typesBundle
        })
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    @def
    private getBatchRequests(): RangeRequest<DataRequest>[] {
        function concat<T>(a?: T[], b?: T[]): T[] | undefined {
            let result: T[] = []
            if (a) {
                result.push(...a)
            }
            if (b) {
                result.push(...b)
            }
            return result.length == 0 ? undefined : result
        }

        let requests = mergeRangeRequests(this.requests, (a, b) => {
            return {
                includeAllBlocks: a.includeAllBlocks || b.includeAllBlocks,
                events: concat(a.events, b.events),
                calls: concat(a.calls, b.calls),
                evmLogs: concat(a.evmLogs, b.evmLogs),
                ethereumTransactions: concat(a.ethereumTransactions, b.ethereumTransactions),
                contractsEvents: concat(a.contractsEvents, b.contractsEvents),
                gearMessagesQueued: concat(a.gearMessagesQueued, b.gearMessagesQueued),
                gearUserMessagesSent: concat(a.gearUserMessagesSent, b.gearUserMessagesSent)
            }
        })

        if (this.fields) {
            requests = requests.map(({range, request}) => {
                return {
                    range,
                    request: {
                        fields: this.fields,
                        ...request
                    }
                }
            })
        }

        return applyRangeBound(requests, this.blockRange)
    }

    @def
    private getChain(): Chain {
        return new Chain(
            () => this.getChainRpcClient(),
        )
    }

    private processBatch<Store>(
        store: Store,
        batch: Batch<Block<F>>,
        handler: (ctx: DataHandlerContext<Store, F>) => Promise<void>
    ): Promise<void> {
        return handler({
            _chain: this.getChain(),
            log: this.getLogger().child('mapping'),
            store,
            blocks: batch.blocks,
            isHead: batch.isHead,
        })
    }

    /**
     * Run data processing.
     *
     * This method assumes full control over the current OS process as
     * it terminates the entire program in case of error or
     * at the end of data processing.
     *
     * @param database - database is responsible for providing storage to the data handler
     * and persisting mapping progress and status.
     *
     * @param handler - The data handler, see {@link DataHandlerContext} for an API available to the handler.
     */
    run<Store>(database: Database<Store>, handler: (ctx: DataHandlerContext<Store, F>) => Promise<void>): void {
        this.assertNotRunning()
        this.running = true
        let log = this.getLogger()
        runProgram(async () => {
            if (this.rpcEndpoint == null) {
                throw new Error('Chain RPC endpoint is always required. Use .setRpcEndpoint() to specify it.')
            }
            if (this.rpcIngestSettings?.disabled && this.archive == null) {
                throw new Error(
                    'Archive is required when RPC data ingestion is disabled. ' +
                    'Use .setArchive() to specify it.'
                )
            }
            return new Runner({
                database,
                requests: this.getBatchRequests(),
                archive: this.archive == null ? undefined : this.getArchiveDataSource(),
                hotDataSource: this.rpcIngestSettings?.disabled ? undefined : this.getRpcDataSource(),
                allBlocksAreFinal: this.finalityConfirmation === 0,
                process: (s, b) => this.processBatch(s, b as any, handler),
                prometheus: this.prometheus,
                log
            }).run()
        }, err => log.fatal(err))
    }
}
