import {BlockHeader} from '@subsquid/fuel-normalization'
import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {Logger} from '@subsquid/logger'
import {def, addErrorContext, last} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {
    applyRangeBound,
    mergeRangeRequests,
    getSize,
    Range,
    RangeRequest,
    RangeRequestList,
    FiniteRange
} from '@subsquid/util-internal-range'
import {BlockHeader as RawBlockHeader} from '@subsquid/fuel-data/lib/raw-data'
import {HttpDataSource} from '@subsquid/fuel-data/lib/data-source'
import assert from 'assert'
import {FuelGateway} from './archive/source'
import {getFields} from './fields'
import {Block, FieldSelection} from './data/model'
import {GraphqlDataSource} from './graphql'
import {PartialBlock} from './data/data-partial'
import {
    DataRequest,
    ReceiptRequest,
    InputRequest,
    OutputRequest,
    TransactionRequest
} from './data/data-request'


export interface GraphqlSettings {
    /**
     * GraphQL endpoint URL
     */
    url: string
    /**
     * Maximum number of concurrent `blocks` queries.
     *
     * Default is `10`
     */
    strideConcurrency?: number
    /**
     * `blocks` query size.
     *
     * Default is `5`.
     */
    strideSize?: number
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


export type FuelBatchProcessorFields<T> = T extends DataSourceBuilder<infer F> ? F : never


export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private gateway?: GatewaySettings
    private graphql?: GraphqlSettings
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
     * infinite times faster and more efficient than via regular GraphQL.
     *
     * @example
     * processor.setGateway('https://v2.archive.subsquid.io/network/fuel-mainnet')
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
     * Set up GraphQL data ingestion
     */
    setGraphql(settings?: GraphqlSettings): this {
        this.assertNotRunning()
        this.graphql = settings
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
    setFields<F extends FieldSelection>(fields: F): DataSourceBuilder<F> {
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
    private getRequests(): RangeRequest<DataRequest>[] {
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

    build(): DataSource<Block<F>> {
        return new FuelDataSource(
            this.getRequests(),
            this.gateway,
            this.graphql
        ) as DataSource<Block<F>>
    }
}


export interface DataSource<Block> {
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<string | undefined>
    getBlocksCountInRange(range: FiniteRange): number
    getBlockStream(fromBlockHeight?: number): AsyncIterable<Block[]>
}


export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never


class FuelDataSource implements DataSource<PartialBlock> {
    private graphql?: GraphqlDataSource
    private isConsistent?: boolean
    private ranges: Range[]

    constructor(
        private requests: RangeRequestList<DataRequest>,
        private gatewaySettings?: GatewaySettings,
        graphqlSettings?: GraphqlSettings
    ) {
        assert(this.gatewaySettings || graphqlSettings, 'either gateway or GraphQL should be provided')
        if (graphqlSettings) {
            this.graphql = this.createGraphqlDataSource(graphqlSettings)
        }
        this.ranges = this.requests.map(req => req.range)
    }

    getFinalizedHeight(): Promise<number> {
        if (this.graphql) {
            return this.graphql.getFinalizedHeight()
        } else {
            return this.createGateway().getFinalizedHeight()
        }
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        await this.assertConsistency()
        if (this.gatewaySettings == null) {
            assert(this.graphql)
            return this.graphql.getBlockHash(height)
        } else {
            let gateway = this.createGateway()
            let head = await gateway.getFinalizedHeight()
            if (head >= height) return gateway.getBlockHash(height)
            if (this.graphql) return this.graphql.getBlockHash(height)
        }
    }

    private async assertConsistency(): Promise<void> {
        if (this.isConsistent || this.gatewaySettings == null || this.graphql == null) return
        let blocks = await this.performConsistencyCheck().catch(err => {
            throw addErrorContext(
                new Error(`Failed to check consistency between Subsquid Gateway and GraphQL endpoints`),
                {reason: err}
            )
        })
        if (blocks == null) {
            this.isConsistent = true
        } else {
            throw addErrorContext(
                new Error(`Provided Subsquid Gateway and GraphQL endpoints don't agree on block №${blocks.archiveBlock.height}`),
                blocks
            )
        }
    }

    private async performConsistencyCheck(): Promise<{
        archiveBlock: BlockHeader
        gqlBlock: RawBlockHeader | null
    } | undefined> {
        let archive = this.createGateway()
        let height = await archive.getFinalizedHeight()
        let archiveBlock = await archive.getBlockHeader(height)
        let gqlBlock = await this.graphql!.getBlockHeader(archiveBlock.height)
        if (gqlBlock?.id === archiveBlock.hash && Number(gqlBlock.height) === archiveBlock.height) return
        return {archiveBlock, gqlBlock: gqlBlock || null}
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize(this.ranges, range)
    }

    async *getBlockStream(fromBlockHeight?: number): AsyncIterable<PartialBlock[]> {
        await this.assertConsistency()

        let requests = fromBlockHeight == null
            ? this.requests
            : applyRangeBound(this.requests, {from: fromBlockHeight})

        if (requests.length == 0) return

        if (this.gatewaySettings) {
            let agent = new HttpAgent({keepAlive: true})
            try {
                let archive = this.createGateway(agent)
                let height = await archive.getFinalizedHeight()
                let from = requests[0].range.from
                if (height > from || !this.graphql) {
                    for await (let batch of archive.getBlockStream(requests, !!this.graphql)) {
                        yield batch
                        from = last(batch).header.height + 1
                    }
                    requests = applyRangeBound(requests, {from})
                }
            } finally {
                agent.close()
            }
        }

        if (requests.length == 0) return

        assert(this.graphql)

        yield* this.graphql.getBlockStream(requests)
    }

    private createGateway(agent?: HttpAgent): FuelGateway {
        assert(this.gatewaySettings)

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent
        })

        return new FuelGateway(
            new ArchiveClient({
                http,
                url: this.gatewaySettings.url,
                queryTimeout: this.gatewaySettings.requestTimeout,
            })
        )
    }

    private createGraphqlDataSource(settings: GraphqlSettings): GraphqlDataSource {
        let dataSource = new HttpDataSource({
            client: new HttpClient({baseUrl: settings.url}),
            strideConcurrency: settings.strideConcurrency,
            strideSize: settings.strideSize,
        })
        return new GraphqlDataSource(dataSource)
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
