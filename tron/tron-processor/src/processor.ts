import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
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
import {HttpApi} from '@subsquid/tron-dump/lib/http'
import assert from 'assert'
import {Chain} from './chain'
import {TronArchive} from './ds-archive'
// import {RpcDataSource} from './ds-rpc'
import {Block, FieldSelection} from './interfaces/data'
import {
    TransactionRequest,
    TriggerSmartContractTransactionRequest,
    DataRequest,
    TransferAssetTransactionRequest,
    LogRequest,
    TransferTransactionRequest,
    InternalTransactionRequest
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


export type TronBatchProcessorFields<T> = T extends TronBatchProcessor<infer F> ? F : never


/**
 * Provides methods to configure and launch data processing.
 */
export class TronBatchProcessor<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private src?: DataSource
    private finalityConfirmation?: number
    private chainPollInterval?: number
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
    setFields<T extends FieldSelection>(fields: T): TronBatchProcessor<T> {
        this.assertNotRunning()
        this.fields = fields
        return this as any
    }

    addLog(options: LogRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({logs: [options]}, options.range)
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({transactions: [options]}, options.range)
        return this
    }

    addTransferTransaction(options: TransferTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({transferTransactions: [options]}, options.range)
        return this
    }

    addTransferAssetTransaction(options: TransferAssetTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({transferAssetTransactions: [options]}, options.range)
        return this
    }

    addTriggerSmartContractTransaction(options: TriggerSmartContractTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({triggerSmartContractTransactions: [options]}, options.range)
        return this
    }

    addInternalTransaction(options: InternalTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        this.add({internalTransactions: [options]}, options.range)
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
     *     chain: 'https://api.trongrid.io',
     *     archive: 'https://tron.archive.subsquid.io/mainnet'
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

    /**
     * Never use RPC endpoint as a data source
     */
    useArchiveOnly(yes?: boolean): this {
        this.assertNotRunning()
        this._useArchiveOnly = yes !== false
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

    // @def
    // private getRpcDataSource(): RpcDataSource {
    //     return new RpcDataSource({
    //         rpc: this.getChainRpcClient(),
    //         pollInterval: this.chainPollInterval,
    //     })
    // }

    // @def
    // private getChainHttpClient() {
    //     return new HttpClient({})
    // }

    // @def
    // private getHttpDataSource() {
    //     return new HttpDataSource({})
    // }

    @def
    private getArchiveDataSource(): TronArchive {
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

        let options = this.src?.chain
        if (options == null) {
            throw new Error(`use .setDataSource() to specify chain RPC endpoint`)
        }
        if (typeof options == 'string') {
            options = {url: options}
        }

        return new TronArchive({
            client: new ArchiveClient({http, url, log}),
            httpApi: new HttpApi(new HttpClient({
                baseUrl: options.url,
                retryAttempts: Number.MAX_SAFE_INTEGER
            })),
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
                logs: concat(a.logs, b.logs),
                transactions: concat(a.transactions, b.transactions),
                transferTransactions: concat(a.transferTransactions, b.transferTransactions),
                transferAssetTransactions: concat(a.transferAssetTransactions, b.transferAssetTransactions),
                triggerSmartContractTransactions: concat(a.triggerSmartContractTransactions, b.triggerSmartContractTransactions),
                internalTransactions: concat(a.internalTransactions, b.internalTransactions)
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
                hotDataSource: undefined,
                // hotDataSource: this._useArchiveOnly ? undefined : this.getHttpDataSource(),
                process: (s, b) => this.processBatch(s, b as any, handler),
                prometheus: this.prometheus,
                log
            }).run()
        }, err => log.fatal(err))
    }
}
