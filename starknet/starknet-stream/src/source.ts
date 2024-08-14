import {
    applyRangeBound,
    mergeRangeRequests,
    getSize,
    Range,
    RangeRequest,
    RangeRequestList,
    FiniteRange
} from '@subsquid/util-internal-range'
import {Block, FieldSelection} from './data/model'
import {
    DataRequest,
    EventRequest,
    TransactionRequest
} from './data/data-request'
import {def, last} from '@subsquid/util-internal'
import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import assert from 'assert'
import {getFields} from './fields'
import {PartialBlock} from './data/data-partial'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {StarknetGateway} from './archive/source'


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
     * processor.setGateway('https://v2.archive.subsquid.io/network/starknet-mainnet')
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

    addEvent(options: EventRequest & BlockRange): this {
        this.assertNotRunning()
        let {range, ...req} = options
        this.add(range, {
            events: [req]
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
                transactions: concat(a.transactions, b.transactions)
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
        return new StarknetDataSource(
            this.getRequests(),
            this.gateway
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

class StarknetDataSource implements DataSource<PartialBlock> {
    private ranges: Range[]

    constructor(
        private requests: RangeRequestList<DataRequest>,
        private gatewaySettings?: GatewaySettings
    ) {
        assert(this.gatewaySettings, 'gateway should be provided')
        this.ranges = this.requests.map(req => req.range)
    }

    getFinalizedHeight(): Promise<number> {
        return this.createGateway().getFinalizedHeight()
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let gateway = this.createGateway()
        let head = await gateway.getFinalizedHeight()
        if (head >= height) {
            return gateway.getBlockHash(height)
        } else {
            return undefined
        }
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize(this.ranges, range)
    }

    async *getBlockStream(fromBlockHeight?: number): AsyncIterable<PartialBlock[]> {
        let requests = fromBlockHeight == null
            ? this.requests
            : applyRangeBound(this.requests, {from: fromBlockHeight})

        if (requests.length == 0) return

        let agent = new HttpAgent({keepAlive: true})
        try {
            let archive = this.createGateway(agent)
            let height = await archive.getFinalizedHeight()
            let from = requests[0].range.from

            if (height > from) {
                for await (let batch of archive.getBlockStream(requests)) {
                    yield batch
                    from = last(batch).header.height + 1
                }
            }
            requests = applyRangeBound(requests, {from})
        } finally {
            agent.close()
        }
    }

    private createGateway(agent?: HttpAgent): StarknetGateway {
        assert(this.gatewaySettings)

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent
        })

        return new StarknetGateway(
            new ArchiveClient({
                http,
                url: this.gatewaySettings.url,
                queryTimeout: this.gatewaySettings.requestTimeout,
            })
        )
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}