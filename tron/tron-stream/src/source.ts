import {BlockHeader} from '@subsquid/tron-normalization'
import {HttpAgent, HttpClient} from '@subsquid/http-client'
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
import {
    HttpApi,
    TronHttpClient,
    Block as RawBlock,
    HttpDataSource as RawHttpDataSource
} from '@subsquid/tron-data'
import assert from 'assert'
import {HttpDataSource} from './http/source'
import {TronGateway} from './gateway/source'
import {Block, FieldSelection} from './data/model'
import {getFields} from './data/fields'
import {PartialBlock} from './data/data-partial'
import {
    DataRequest,
    LogRequest,
    TransactionRequest,
    TransferTransactionRequest,
    TransferAssetTransactionRequest,
    TriggerSmartContractTransactionRequest,
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


export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private gateway?: GatewaySettings
    private httpApi?: HttpApiSettings
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
     * By default, the stream will fetch only blocks
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

    addLog(options: LogRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {logs: [req]})
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {transactions: [req]})
        return this
    }

    addTransferTransaction(options: TransferTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {transferTransactions: [req]})
        return this
    }

    addTransferAssetTransaction(options: TransferAssetTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {transferAssetTransactions: [req]})
        return this
    }

    addTriggerSmartContractTransaction(options: TriggerSmartContractTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {triggerSmartContractTransactions: [req]})
        return this
    }

    addInternalTransaction(options: InternalTransactionRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {internalTransactions: [req]})
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
                logs: concat(a.logs, b.logs),
                transactions: concat(a.transactions, b.transactions),
                transferTransactions: concat(a.transferTransactions, b.transferTransactions),
                transferAssetTransactions: concat(a.transferAssetTransactions, b.transferAssetTransactions),
                triggerSmartContractTransactions: concat(a.triggerSmartContractTransactions, b.triggerSmartContractTransactions),
                internalTransactions: concat(a.internalTransactions, b.internalTransactions),
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
        return new TronDataSource(
            this.getRequests(),
            this.gateway,
            this.httpApi
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


class TronDataSource implements DataSource<PartialBlock> {
    private httpApi?: HttpDataSource
    private isConsistent?: boolean
    private ranges: Range[]

    constructor(
        private requests: RangeRequestList<DataRequest>,
        private gatewaySettings?: GatewaySettings,
        httpApiSettings?: HttpApiSettings
    ) {
        assert(this.gatewaySettings || httpApiSettings, 'either gateway or HTTP API should be provided')
        if (httpApiSettings) {
            this.httpApi = this.createHttpDataSource(httpApiSettings)
        }
        this.ranges = this.requests.map(req => req.range)
    }

    getFinalizedHeight(): Promise<number> {
        if (this.httpApi) {
            return this.httpApi.getFinalizedHeight()
        } else {
            return this.createGateway().getFinalizedHeight()
        }
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        await this.assertConsistency()
        if (this.gatewaySettings == null) {
            assert(this.httpApi)
            return this.httpApi.getBlockHash(height)
        } else {
            let gateway = this.createGateway()
            let head = await gateway.getFinalizedHeight()
            if (head >= height) return gateway.getBlockHash(height)
            if (this.httpApi) return this.httpApi.getBlockHash(height)
        }
    }

    private async assertConsistency(): Promise<void> {
        if (this.isConsistent || this.gatewaySettings == null || this.httpApi == null) return
        let blocks = await this.performConsistencyCheck().catch(err => {
            throw addErrorContext(
                new Error(`Failed to check consistency between Subsquid Gateway and HTTP API endpoints`),
                {reason: err}
            )
        })
        if (blocks == null) {
            this.isConsistent = true
        } else {
            throw addErrorContext(
                new Error(`Provided Subsquid Gateway and HTTP API endpoints don't agree on block №${blocks.gatewayBlock.height}`),
                blocks
            )
        }
    }

    private async performConsistencyCheck(): Promise<{
        gatewayBlock: BlockHeader
        httpApiBlock: RawBlock | null
    } | undefined> {
        let gateway = this.createGateway()
        let height = await gateway.getFinalizedHeight()
        let gatewayBlock = await gateway.getBlockHeader(height)
        let httpApiBlock = await this.httpApi!.getBlockHeader(gatewayBlock.height)
        if (httpApiBlock?.blockID === gatewayBlock.hash && httpApiBlock.block_header.raw_data.number === gatewayBlock.height) return
        return {gatewayBlock, httpApiBlock: httpApiBlock || null}
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
                let gateway = this.createGateway(agent)
                let height = await gateway.getFinalizedHeight()
                let from = requests[0].range.from
                if (height > from || !this.httpApi) {
                    for await (let batch of gateway.getBlockStream(requests, !!this.httpApi)) {
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

        assert(this.httpApi)

        yield* this.httpApi.getBlockStream(requests)
    }

    private createGateway(agent?: HttpAgent): TronGateway {
        assert(this.gatewaySettings)

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent
        })

        return new TronGateway(
            new ArchiveClient({
                http,
                url: this.gatewaySettings.url,
                queryTimeout: this.gatewaySettings.requestTimeout,
            })
        )
    }

    private createHttpDataSource(settings: HttpApiSettings): HttpDataSource {
        let client = new TronHttpClient({
            baseUrl: settings.url,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })
        let dataSource = new RawHttpDataSource({
            httpApi: new HttpApi(client),
            strideConcurrency: settings.strideConcurrency,
            strideSize: settings.strideSize,
            headPollInterval: settings.headPollInterval,
        })
        return new HttpDataSource(dataSource)
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
