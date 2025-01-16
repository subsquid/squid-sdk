import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {BlockInfo} from '@subsquid/solana-rpc'
import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {addErrorContext, def, last} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {
    applyRangeBound,
    FiniteRange,
    getSize,
    mergeRangeRequests,
    Range,
    RangeRequest,
    RangeRequestList
} from '@subsquid/util-internal-range'
import assert from 'assert'
import {SolanaArchive} from './archive/source'
import {getFields} from './data/fields'
import {Block, BlockHeader, FieldSelection} from './data/model'
import {PartialBlock} from './data/partial'
import {
    BalanceRequest,
    DataRequest,
    InstructionRequest,
    LogRequest,
    RewardRequest,
    TokenBalanceRequest,
    TransactionRequest
} from './data/request'
import {SolanaRpcClient} from './rpc/client'
import {RpcDataSource} from './rpc/source'
import {SolanaPortal} from './archive/portal'
import {PortalClient} from '@subsquid/portal-client'


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


export interface PortalSettings {
    /**
     * Subsquid Network Gateway url
     */
    url: string
    /**
     * Request timeout in ms
     */
    requestTimeout?: number

    retryAttempts?: number
    
    bufferThreshold?: number

    newBlockTimeout?: number
}


export interface RpcSettings {
    /**
     * RPC client
     */
    client: SolanaRpcClient
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
    private archive?: GatewaySettings & {type: 'gateway'} | PortalSettings & {type: 'portal'}
    private rpc?: RpcSettings

    /**
     * Set Subsquid Network Gateway endpoint (ex Archive).
     *
     * Subsquid Network allows to get data from finalized blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * source.setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
     */
    setGateway(url: string | GatewaySettings): this {
        assert(this.archive?.type !== 'gateway', '.setGateway() can not be used together with .setPortal()')
        if (typeof url == 'string') {
            this.archive = {url, type: 'gateway'}
        } else {
            this.archive = {...url, type: 'gateway'}
        }
        return this
    }


    setPortal(url: string | PortalSettings): this {
        assert(this.archive?.type !== 'gateway', '.setPortal() can not be used together with .setGateway()')
        if (typeof url == 'string') {
            this.archive = {url, type: 'portal', }
        } else {
            this.archive = {...url, type: 'portal'}
        }
        return this
    }


    /**
     * Set up RPC data ingestion
     */
    setRpc(settings?: RpcSettings): this {
        this.rpc = settings
        return this
    }

    /**
     * Limits the range of blocks to fetch.
     *
     * Note, that block heights should be used instead of slots.
     */
    setBlockRange(range?: Range): this {
        this.blockRange = range
        return this
    }

    /**
     * Configure a set of fetched fields
     */
    setFields<F extends FieldSelection>(fields: F): DataSourceBuilder<F> {
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
     * By default, blocks that doesn't contain requested items can be omitted.
     * This method modifies such behaviour to fetch all chain blocks.
     *
     * Optionally a range of blocks can be specified
     * for which the setting should be effective.
     */
    includeAllBlocks(range?: Range): this {
        this.add(range, {includeAllBlocks: true})
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            transactions: [req]
        })
        return this
    }

    addInstruction(options: InstructionRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            instructions: [req]
        })
        return this
    }

    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            logs: [req]
        })
        return this
    }

    addBalance(options: BalanceRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            balances: [req]
        })
        return this
    }

    addTokenBalance(options: TokenBalanceRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            tokenBalances: [req]
        })
        return this
    }

    addReward(options: RewardRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            rewards: [req]
        })
        return this
    }

    private getRequests(): RangeRequestList<DataRequest> {
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
                instructions: concat(a.instructions, b.instructions),
                logs: concat(a.logs, b.logs),
                balances: concat(a.balances, b.balances),
                tokenBalances: concat(a.tokenBalances, b.tokenBalances),
                rewards: concat(a.rewards, b.rewards)
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
        return new SolanaDataSource(
            this.getRequests(),
            this.archive,
            this.rpc
        ) as DataSource<Block<F>>
    }
}


export interface DataSource<Block> {
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<Base58Bytes | undefined>
    getBlocksCountInRange(range: FiniteRange): number
    getBlockStream(fromBlockHeight?: number): AsyncIterable<Block[]>
}


export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never


class SolanaDataSource implements DataSource<PartialBlock> {
    private rpc?: RpcDataSource
    private isConsistent?: boolean
    private ranges: Range[]

    constructor(
        private requests: RangeRequestList<DataRequest>,
        private archiveSettings?: GatewaySettings & {type: 'gateway'} | PortalSettings & {type: 'portal'},
        rpcSettings?: RpcSettings
    ) {
        assert(this.archiveSettings || rpcSettings, 'either archive or RPC should be provided')
        if (rpcSettings) {
            this.rpc = new RpcDataSource(rpcSettings)
        }
        this.ranges = this.requests.map(req => req.range)
    }

    getFinalizedHeight(): Promise<number> {
        if (this.rpc) {
            return this.rpc.getFinalizedHeight()
        } else {
            return this.createArchive().getFinalizedHeight()
        }
    }

    async getBlockHash(height: number): Promise<Base58Bytes | undefined> {
        await this.assertConsistency()
        if (this.archiveSettings == null) {
            assert(this.rpc)
            return this.rpc.getBlockHash(height)
        } else {
            let archive = this.createArchive()
            let hash = await archive.getBlockHash(height)
            if (hash == null && this.rpc) {
                hash = await this.rpc.getBlockHash(height)
            }
            return hash
        }
    }

    private async assertConsistency(): Promise<void> {
        if (this.isConsistent || this.archiveSettings == null || this.rpc == null) return
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
        rpcBlock: BlockInfo | null
    } | undefined> {
        let archive = this.createArchive()
        let height = await archive.getFinalizedHeight()
        let archiveBlock = await archive.getBlockHeader(height)
        let rpcBlock = await this.rpc!.getBlockInfo(archiveBlock.slot)
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

        if (this.archiveSettings) {
            let agent = new HttpAgent({keepAlive: true})
            try {
                let archive = this.createArchive(agent)
                let height = await archive.getFinalizedHeight()
                let from = requests[0].range.from
                if (height > from || !this.rpc) {
                    for await (let batch of archive.getBlockStream(requests, !!this.rpc)) {
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

        assert(this.rpc)

        yield* this.rpc.getBlockStream(requests)
    }

    private createArchive(agent?: HttpAgent): SolanaArchive | SolanaPortal {
        assert(this.archiveSettings)

        let headers = {
            'x-squid-id': this.getSquidId(),
        }

        return this.archiveSettings.type === 'gateway'
            ? new SolanaArchive(
                  new ArchiveClient({
                        http: new HttpClient({
                            headers: {
                                'x-squid-id': this.getSquidId(),
                            },
                            agent,
                        }),
                        url: this.archiveSettings.url,
                        queryTimeout: this.archiveSettings.requestTimeout,
                  })
              )
            : new SolanaPortal(
                  new PortalClient({
                        http: new HttpClient({
                            headers,
                            agent,
                            httpTimeout: this.archiveSettings.requestTimeout,
                            retryAttempts: this.archiveSettings.retryAttempts,
                        }),
                        url: this.archiveSettings.url,
                        minBytes: this.archiveSettings.bufferThreshold,
                        maxIdleTime: this.archiveSettings.newBlockTimeout,
                  })
              )
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
