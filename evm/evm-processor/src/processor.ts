import {createLogger, Logger} from '@subsquid/logger'
import {def, runProgram} from '@subsquid/util-internal'
import {HttpClient} from '@subsquid/util-internal-http-client'
import {HttpAgent} from '@subsquid/util-internal-http-client/lib/agent'
import {
    applyRangeBound,
    BatchRequest,
    Database,
    getOrGenerateSquidId,
    mergeBatchRequests,
    Metrics,
    Range,
    Runner
} from '@subsquid/util-internal-processor-tools'
import {RpcClient} from '@subsquid/util-internal-resilient-rpc'
import {ArchiveDataSource} from './archive/client'
import {Chain} from './interfaces/chain'
import {BlockData, DataRequest, EvmTopicSet, Fields} from './interfaces/data'


export interface DataSource {
    /**
     * Subsquid substrate archive endpoint URL
     */
    archive: string
    /**
     * Chain node RPC endpoint URL
     */
    chain?: string
}


export interface LogOptions {
    /**
     * Address of the emitting contract
     */
    address?: string | string[]
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet
    /**
     * Block range
     */
    range?: Range
}


export interface TransactionOptions {
    /**
     * Address of the called contract
     */
    to?: string | string[]
    /**
     * Address of the tx author
     */
    from?: string | string[]
    /**
     * Sighash of the invoked contract method
     */
    sighash?: string | string[]
    /**
     * Block range
     */
    range?: Range
}


export interface DataHandlerContext<Store, F extends Fields = {}> {
    _chain: Chain
    log: Logger
    store: Store
    blocks: BlockData<F>[]
    isHead: boolean
}


/**
 * Provides methods to configure and launch data processing.
 */
export class EvmBatchProcessor<F extends Fields = {}> {
    private requests: BatchRequest<DataRequest>[] = []
    private src?: DataSource
    private blockRange?: Range
    private prometheusPort?: string | number
    private fields?: Fields
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
    setFields<T extends Fields>(fields: T): EvmBatchProcessor<T> {
        this.assertNotRunning()
        this.fields = fields
        return this as any
    }

    addLog(options: LogOptions): this {
        this.assertNotRunning()
        this.add({
            logs: [{
                address: toRequestList(options.address),
                filter: options.filter?.length ? options.filter : undefined
            }]
        }, options.range)
        return this
    }

    addTransaction(options: TransactionOptions): this {
        this.assertNotRunning()
        this.add({
            transactions: [{
                from: toRequestList(options.from),
                to: toRequestList(options.to),
                sighash: toRequestList(options.sighash)
            }]
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
        this.prometheusPort = port
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
     *     archive: 'https://eth.archive.subsquid.io'
     * })
     */
    setDataSource(src: DataSource): this {
        this.assertNotRunning()
        this.src = src
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

    private getArchiveEndpoint(): string {
        let url = this.src?.archive
        if (url == null) {
            throw new Error('use .setDataSource() to specify archive url')
        }
        return url
    }

    @def
    private getChainClient(): RpcClient {
        let url = this.src?.chain
        if (url == null) {
            throw new Error(`use .setDataSource() to specify chain RPC endpoint`)
        }
        return new RpcClient({
            endpoints: [{url, capacity: 5}],
            retryAttempts: Number.MAX_SAFE_INTEGER,
            requestTimeout: 20_000,
            log: this.getLogger().child('rpc')
        })
    }

    @def
    private getChain(): Chain {
        let self = this
        return {
            get client() {
                return self.getChainClient()
            }
        }
    }

    @def
    private getArchiveDataSource(): ArchiveDataSource {
        let http = new HttpClient({
            baseUrl: this.getArchiveEndpoint(),
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent: new HttpAgent({
                keepAlive: true
            }),
            httpTimeout: 20_000,
            retryAttempts: Number.MAX_SAFE_INTEGER,
            log: this.getLogger().child('archive')
        })

        return new ArchiveDataSource(http)
    }

    @def
    private getBatchRequests(): BatchRequest<DataRequest>[] {
        let requests = mergeBatchRequests(this.requests, function merge(a: DataRequest, b: DataRequest) {
            let res: DataRequest = {}
            if (a.includeAllBlocks || b.includeAllBlocks) {
                res.includeAllBlocks = true
            }
            res.logs = concatRequestLists(a.logs, b.logs)
            res.transactions = concatRequestLists(a.transactions, b.transactions)
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
            let runner = new Runner({
                database,
                requests: this.getBatchRequests(),
                src: this.getArchiveDataSource(),
                srcPollInterval: 2000,
                metrics: new Metrics(),
                prometheusPort: this.prometheusPort || 0,
                log
            })

            let chain = this.getChain()

            runner.processBatch = function(store, batch) {
                return handler({
                    _chain: chain,
                    log: log.child('mapping', {batchRange: batch.range}),
                    store,
                    blocks: batch.blocks as any,
                    isHead: batch.isHead
                })
            }

            return runner.run()

        }, err => log.fatal(err))
    }
}


function toRequestList(val?: string | string[]): string[] | undefined {
    if (val == null) return undefined
    if (!Array.isArray(val)) {
        val = [val]
    }
    if (val.length == 0) return undefined
    return val.map(s => s.toLowerCase())
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
