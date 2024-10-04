import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {assertNotNull, def, runProgram} from '@subsquid/util-internal'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest} from '@subsquid/util-internal-range'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {
    Batch,
    Database,
    getOrGenerateSquidId,
    PrometheusServer,
    Runner
} from '@subsquid/util-internal-processor-tools'
import * as base from '@subsquid/tron-data'
import assert from 'assert'
import {HttpDataSource} from './http/source'
import {TronGateway} from './gateway/source'
import {Block, FieldSelection} from './data/model'
import {
    TransactionRequest,
    TriggerSmartContractTransactionRequest,
    DataRequest,
    TransferAssetTransactionRequest,
    LogRequest,
    TransferTransactionRequest,
    InternalTransactionRequest
} from './data/data-request'


export interface HttpApiSettings {
    /**
     * HTTP API endpoint URL
     */
    url: string
    /**
     * Maximum number of concurrent `blocks` queries.
     *
     * Default is `2`
     */
    strideConcurrency?: number
    /**
     * `blocks` query size.
     *
     * Default is `10`.
     */
    strideSize?: number
    /**
     * Poll interval for new blocks in `ms`
     *
     * Poll mechanism is used to get new blocks via HTTP connection.
     */
    headPollInterval?: number
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


interface BlockRange {
    range?: Range
}


export interface DataHandlerContext<Store, Fields extends FieldSelection> {
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
    private gateway?: GatewaySettings
    private httpApi?: HttpApiSettings
    private prometheus = new PrometheusServer()
    private running = false

    /**
     * Set Subsquid Network Gateway endpoint (ex Archive).
     *
     * Subsquid Network allows to get data from finalized blocks up to
     * infinite times faster and more efficient than via regular HTTP API.
     *
     * @example
     * source.setGateway('https://v2.archive.subsquid.io/network/tron-mainnet')
     */
    setGateway(url: string | GatewaySettings): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.gateway = {url}
        } else {
            this.gateway = url
        }
        return this
    }

    /**
     * Set up HTTP API data ingestion
     */
    setHttpApi(settings?: HttpApiSettings): this {
        this.assertNotRunning()
        this.httpApi = settings
        return this
    }

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
    private getHttpDataSource(): HttpDataSource {
        assert(this.httpApi)
        let client = new base.TronHttpClient({
            baseUrl: this.httpApi.url,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
        let dataSource = new base.HttpDataSource({
            httpApi: new base.HttpApi(client),
            strideConcurrency: this.httpApi.strideConcurrency,
            strideSize: this.httpApi.strideSize,
            headPollInterval: this.httpApi.headPollInterval,
        })
        return new HttpDataSource(dataSource)
    }

    @def
    private getGatewayDataSource(): TronGateway {
        let gateway = assertNotNull(this.gateway)

        let log = this.getLogger().child('gateway')

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent: new HttpAgent({
                keepAlive: true
            }),
            log
        })

        return new TronGateway(
            new ArchiveClient({
                http,
                url: gateway.url,
                queryTimeout: gateway.requestTimeout,
                log
            }),
        )
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

    private processBatch<Store>(
        store: Store,
        batch: Batch<Block<F>>,
        handler: (ctx: DataHandlerContext<Store, F>) => Promise<void>
    ): Promise<void> {
        return handler({
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
            if (this.gateway == null && this.httpApi == null) {
                throw new Error(
                    'No data source where specified. ' +
                    'Use .setGateway() to specify Subsquid Network Gateway and/or .setHttpApi() to specify HTTP API endpoint.'
                )
            }

            return new Runner({
                database,
                requests: this.getBatchRequests(),
                archive: this.gateway == null ? undefined : this.getGatewayDataSource(),
                hotDataSource: this.httpApi == null ? undefined : this.getHttpDataSource(),
                process: (s, b) => this.processBatch(s, b as any, handler),
                prometheus: this.prometheus,
                log
            }).run()
        }, err => log.fatal(err))
    }
}
