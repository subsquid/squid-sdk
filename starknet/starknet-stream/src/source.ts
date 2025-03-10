import {
    applyRangeBound,
    mergeRangeRequests,
    getSize,
    Range,
    RangeRequest,
    RangeRequestList,
    FiniteRange
} from '@subsquid/util-internal-range'
import {Block, BlockHeader, FieldSelection} from './data/model'
import { BlockHeader as BlockHeaderRpc } from '@subsquid/starknet-rpc'
import {
    DataRequest,
    EventRequest,
    TransactionRequest
} from './data/data-request'
import {addErrorContext, def, last} from '@subsquid/util-internal'
import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import assert from 'assert'
import {getFields} from './fields'
import {PartialBlock} from './data/data-partial'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {StarknetGateway} from './archive/source'
import {StarknetRpcClient} from './rpc/client'
import {RpcDataSource} from './rpc/source'


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


export interface RpcSettings {
    /**
     * RPC client
     */
    client: StarknetRpcClient
    /**
     * `getBlock` batch call size.
     *
     * Default is `5`.
     */
    strideSize?: number
    /**
     * Maximum number of concurrent `getBlock` batch calls.
     *
     * Default is `10`
     */
    strideConcurrency?: number
    /**
     * Minimum distance from finalized head below which concurrent
     * fetch procedure is allowed.
     *
     * Default is `50` blocks.
     *
     * Concurrent fetch procedure can perform multiple `getBlock` batch calls simultaneously and is faster,
     * but assumes consistent behaviour of RPC endpoint.
     *
     * The latter might not be the case due to load balancing,
     * when one request is sent to node `A` with head slot `X` and
     * another to node `B` with head slot `X - 10`.
     */
    concurrentFetchThreshold?: number
}


interface BlockRange {
    range?: Range
}


export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private gateway?: GatewaySettings
    private rpc?: RpcSettings
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
     * Set chain RPC endpoint
     *
     * @example
     * // just pass a URL
     * processor.setRpc('https://starknet-mainnet.public.blastapi.io')
     */
    setRpc(settings?: RpcSettings): this {
        this.rpc = settings
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
                transactions: concat(a.transactions, b.transactions),
                events: concat(a.events, b.events)
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
            this.gateway,
            this.rpc
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
    private rpc?: RpcDataSource
    private isConsistent?: boolean
    private ranges: Range[]

    constructor(
        private requests: RangeRequestList<DataRequest>,
        private gatewaySettings?: GatewaySettings,
        rpcSettings?: RpcSettings
    ) {
        assert(this.gatewaySettings || rpcSettings, 'either archive or RPC should be provided')
        if (rpcSettings) {
            this.rpc = new RpcDataSource(rpcSettings)
        }
        this.ranges = this.requests.map(req => req.range)
    }

    getFinalizedHeight(): Promise<number> {
        if (this.rpc) {
            return this.rpc.getFinalizedHeight()
        } else {
            return this.createGateway().getFinalizedHeight()
        }
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        await this.assertConsistency()
        if (this.gatewaySettings == null) {
            assert(this.rpc)
            return this.rpc.getBlockHash(height)
        } else {
            let gateway = this.createGateway()
            let head = await gateway.getFinalizedHeight()
            if (head >= height) return gateway.getBlockHash(height)
            if (this.rpc) return this.rpc.getBlockHash(height)
        }
    }

    private async assertConsistency(): Promise<void> {
        if (this.isConsistent || this.gatewaySettings == null || this.rpc == null) return
        let blocks = await this.performConsistencyCheck().catch(err => {
            throw addErrorContext(
                new Error(`Failed to check consistency between Subsquid Gateway and RPC endpoints`),
                {reason: err}
            )
        })
        if (blocks == null) {
            this.isConsistent = true
        } else {
            throw addErrorContext(
                new Error(`Provided Subsquid Gateway and RPC endpoints don't agree on slot ${blocks.archiveBlock.slot}`),
                blocks
            )
        }
    }

    private async performConsistencyCheck(): Promise<{
        archiveBlock: BlockHeader
        rpcBlock: BlockHeaderRpc | null
    } | undefined> {
        let archive = this.createGateway()
        let height = await archive.getFinalizedHeight()
        let archiveBlock = await archive.getBlockHeader(height)
        let rpcBlock = await this.rpc!.getBlockHeader(archiveBlock.height)
        if (rpcBlock?.blockhash === archiveBlock.hash && rpcBlock.blockHeight === archiveBlock.height) return
        return {archiveBlock, rpcBlock: rpcBlock || null}
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

                if (height > from || !this.rpc) {
                    for await (let batch of archive.getBlockStream(requests, !!this.rpc)) {
                        yield batch
                        from = last(batch).header.height + 1
                    }
                }
                requests = applyRangeBound(requests, {from})
            } finally {
                agent.close()
            }
        }

        if (requests.length == 0) return

        assert(this.rpc)

        yield* this.rpc.getBlockStream(requests)
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