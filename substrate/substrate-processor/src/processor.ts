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
import {
    applyRangeBound,
    Batch,
    Database,
    getOrGenerateSquidId,
    mergeRangeRequests,
    PrometheusServer,
    Range,
    RangeRequest,
    Runner
} from '@subsquid/util-internal-processor-tools'
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
    GearMessageEnqueuedRequest,
    GearUserMessageSentRequest
} from './interfaces/data-request'


export interface DataSource {
    /**
     * Subsquid archive endpoint URL
     */
    archive?: string
    /**
     * Chain node RPC endpoint URL
     */
    chain: ChainRpc
}


type ChainRpc = string | {
    url: string
    capacity?: number
    rateLimit?: number
    requestTimeout?: number
    maxBatchCallSize?: number
}


interface BlockRange {
    range?: Range
}


export interface DataHandlerContext<Store, Fields extends FieldSelection> {
    /**
     * @internal
     */
    _chain: Chain
    log: Logger
    store: Store
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
    private src?: DataSource
    private chainPollInterval?: number
    private typesBundle?: OldTypesBundle | OldSpecsBundle
    private prometheus = new PrometheusServer()
    private running = false
    private _useArchiveOnly = false

    private add(request: DataRequest, range?: Range): void {
        this.requests.push({
            range: range || {from: 0},
            request
        })
    }

    /**
     * Configure a set of fetched fields
     */
    setFields<T extends FieldSelection>(fields: T): SubstrateBatchProcessor<T> {
        this.assertNotRunning()
        this.fields = fields
        return this as any
    }

    addEvent(options: EventRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({events: [options]}, options.range)
        return this
    }

    addCall(options: CallRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({calls: [options]}, options.range)
        return this
    }

    addEvmLog(options: EvmLogRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({evmLogs: [{
            ...options,
            address: options.address?.map(s => s.toLowerCase())
        }]}, options.range)
        return this
    }

    addEthereumTransaction(options: EthereumTransactRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({ethereumTransactions: [{
            ...options,
            to: options.to?.map(s => s.toLowerCase())
        }]}, options.range)
        return this
    }

    addContractsContractEmitted(options: ContractsContractEmittedRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({contractsEvents: [options]}, options.range)
        return this
    }

    addGearMessageEnqueued(options: GearMessageEnqueuedRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({gearMessagesEnqueued: [options]}, options.range)
        return this
    }

    addGearUserMessageSent(options: GearUserMessageSentRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({gearUserMessagesSent: [options]}, options.range)
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
     *     chain: 'wss://rpc.polkadot.io',
     *     archive: 'https://substrate.archive.subsquid.io/polkadot'
     * })
     */
    setDataSource(src: DataSource): this {
        this.assertNotRunning()
        this.src = src
        return this
    }

    setChainPollInterval(ms: number): this {
        assert(ms >= 0)
        this.assertNotRunning()
        this.chainPollInterval = ms
        return this
    }

    /**
     * Never use RPC endpoint as a data source
     */
    useArchiveOnly(yes?: boolean): this {
        this.assertNotRunning()
        this._useArchiveOnly = yes !== false
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
        this.prometheus.addChainRpcMetrics(() => client.getMetrics())
        return client
    }

    @def
    private getRpcDataSource(): RpcDataSource {
        return new RpcDataSource({
            rpc: this.getChainRpcClient(),
            pollInterval: this.chainPollInterval,
            typesBundle: this.typesBundle
        })
    }

    @def
    private getArchiveDataSource(): SubstrateArchive {
        let url = assertNotNull(this.src?.archive)

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

        return new SubstrateArchive({
            client: new ArchiveClient({http, url, log}),
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
                gearMessagesEnqueued: concat(a.gearMessagesEnqueued, b.gearMessagesEnqueued),
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
            if (this._useArchiveOnly && this.src?.archive == null) {
                throw new Error('Archive URL is required when .useArchiveOnly() flag is set')
            }
            return new Runner({
                database,
                requests: this.getBatchRequests(),
                archive: this.src?.archive == null ? undefined : this.getArchiveDataSource(),
                hotDataSource: this._useArchiveOnly ? undefined : this.getRpcDataSource(),
                process: (s, b) => this.processBatch(s, b as any, handler),
                prometheus: this.prometheus,
                log
            }).run()
        }, err => log.fatal(err))
    }
}
