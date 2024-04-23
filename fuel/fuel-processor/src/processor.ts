import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {assertNotNull, def, runProgram} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {Database, getOrGenerateSquidId, PrometheusServer, Runner} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest} from '@subsquid/util-internal-range'
import {HttpDataSource} from '@subsquid/fuel-data/lib/data-source'
import {FuelArchive} from './archive/source'
import {getFields} from './fields'
import {Block, FieldSelection} from './interfaces/data'
import {GraphqlDataSource} from './graphql'
import {
    DataRequest,
    ReceiptRequest,
    InputRequest,
    OutputRequest,
    TransactionRequest
} from './interfaces/data-request'


export interface GraphqlEndpointSettings {
    /**
     * GraphQL endpoint URL
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
     * HTTP headers
     */
    headers?: Record<string, string>
}


export interface GraphqlDataIngestionSettings {
    /**
     * Poll interval for new blocks in `ms`
     *
     * Poll mechanism is used to get new blocks via HTTP connection.
     */
    headPollInterval?: number
    strideConcurrency?: number
    strideSize?: number
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


interface BlockRange {
    range?: Range
}



/**
 * API and data that is passed to the data handler
 */
export interface DataHandlerContext<Store, F extends FieldSelection = {}> {
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
    blocks: Block<F>[]
    /**
     * Signals, that the processor reached the head of a chain.
     *
     * The head block is always included in `.blocks`.
     */
    isHead: boolean
}


export type SolanaBatchProcessorFields<T> = T extends FuelBatchProcessor<infer F> ? F : never


/**
 * Provides methods to configure and launch data processing.
 */
export class FuelBatchProcessor<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private gateway?: GatewaySettings
    private graphqlEndpoint?: GraphqlEndpointSettings
    private graphqlIngestSettings?: GraphqlDataIngestionSettings
    private prometheus = new PrometheusServer()
    private running = false

    private assertNotRunning(): void {
        if (this.running) {
            throw new Error('Settings modifications are not allowed after start of processing')
        }
    }

    /**
     * Set Subsquid Network Gateway endpoint (ex Archive).
     *
     * Subsquid Network allows to get data from finalized blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * processor.setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
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
     * Set chain GraphQL endpoint
     *
     * @example
     * // just pass a URL
     * processor.setGraphqlEndpoint('https://beta-5.fuel.network/graphql')
     *
     * // adjust some connection options
     * processor.setGraphqlEndpoint({
     *     url: 'https://beta-5.fuel.network/graphql',
     *     rateLimit: 10
     * })
     */
    setGraphqlEndpoint(url: string | GraphqlEndpointSettings): this {
        this.assertNotRunning()
        if (typeof url == 'string') {
            this.graphqlEndpoint = {url}
        } else {
            this.graphqlEndpoint = url
        }
        return this
    }

    /**
     * Set up GraphQL data ingestion settings
     */
    setGraphqlDataIngestionSettings(settings: GraphqlDataIngestionSettings): this {
        this.assertNotRunning()
        this.graphqlIngestSettings = settings
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
     * Configure a set of fetched fields
     */
    setFields<F extends FieldSelection>(fields: F): FuelBatchProcessor<F> {
        this.assertNotRunning()
        this.fields = fields
        return this as any
    }

    private add(range: Range | undefined, request: DataRequest): void {
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
        this.add(range, {includeAllBlocks: true})
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            transactions: [req]
        })
        return this
    }

    addReceipt(options: ReceiptRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            receipts: [req]
        })
        return this
    }

    addInput(options: InputRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            inputs: [req]
        })
        return this
    }

    addOutput(options: OutputRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            outputs: [req]
        })
        return this
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
                transactions: concat(a.transactions, b.transactions),
                receipts: concat(a.receipts, b.receipts),
                inputs: concat(a.inputs, b.inputs),
                outputs: concat(a.outputs, b.outputs),
            }
        })

        let fields = getFields(this.fields)

        requests = requests.map(({range, request}) => {
            return {
                range,
                request: {
                    fields,
                    ...request
                }
            }
        })

        return applyRangeBound(requests, this.blockRange)
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

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }

    @def
    private getLogger(): Logger {
        return createLogger('sqd:processor')
    }

    @def
    private getGatewayDataSource(): FuelArchive {
        let options = assertNotNull(this.gateway)

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

        return new FuelArchive(
            new ArchiveClient({
                http,
                url: options.url,
                queryTimeout: options.requestTimeout,
                log
            })
        )
    }

    @def
    private getDataSource(): HttpDataSource {
        return new HttpDataSource({
            client: new HttpClient({
                baseUrl: assertNotNull(this.graphqlEndpoint?.url),
            }),
            strideConcurrency: this.graphqlIngestSettings?.strideConcurrency,
        })
    }

    @def
    private getHotDataSource(): GraphqlDataSource {
        return new GraphqlDataSource({
            baseDataSource: this.getDataSource(),
            headPollInterval: this.graphqlIngestSettings?.headPollInterval,
            // newHeadTimeout: this.rpcIngestSettings?.newHeadTimeout,
            // log: this.getLogger().child('rpc', {rpcUrl: this.getChainRpcClient().url})
        })
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
            let mappingLog = log.child('mapping')

            if (this.gateway == null && this.graphqlEndpoint == null) {
                throw new Error(
                    'No data source where provided. ' +
                    'Use .setGateway() to provide Subsquid Network Gateway and/or .setGraphqlEndpoint() to provide GraphQL endpoint.'
                )
            }

            if (this.gateway == null && this.graphqlIngestSettings?.disabled) {
                throw new Error('Subsquid Network Gateway is required when GraphQL data ingestion is disabled')
            }

            return new Runner({
                database,
                requests: this.getBatchRequests(),
                archive: this.gateway ? this.getGatewayDataSource() : undefined,
                hotDataSource: this.graphqlEndpoint && !this.graphqlIngestSettings?.disabled
                    ? this.getHotDataSource()
                    : undefined,
                prometheus: this.prometheus,
                log,
                process(store, batch) {
                    return handler({
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
