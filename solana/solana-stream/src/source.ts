import {HttpAgent, HttpClient} from '@subsquid/http-client'
import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {def, last} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {SolanaArchive} from './archive/source'
import {getFields} from './data/fields'
import {Block, FieldSelection} from './data/model'
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
    client: SolanaRpcClient
}


interface BlockRange {
    range?: Range
}


export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private archive?: GatewaySettings
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
        if (typeof url == 'string') {
            this.archive = {url}
        } else {
            this.archive = url
        }
        return this
    }

    /**
     * Set up RPC data ingestion
     */
    setRpc(settings: RpcSettings): this {
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

    build(): DataSource<F> {
        return new SolanaDataSource<F>(this.getRequests(), this.archive, this.rpc)
    }
}


export interface DataSource<F extends FieldSelection> {
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<Base58Bytes | undefined>
    streamFinalizedBlocks(fromBlockHeight?: number): AsyncIterable<Block<F>[]>
}


class SolanaDataSource<F extends FieldSelection> implements DataSource<F> {
    private rpc?: RpcDataSource

    constructor(
        private requests: RangeRequestList<DataRequest>,
        private archiveSettings?: GatewaySettings,
        rpcSettings?: RpcSettings
    ) {
        assert(this.archiveSettings || rpcSettings, 'at least either archive or RPC should be specified')
        if (rpcSettings) {
            this.rpc = new RpcDataSource(rpcSettings)
        }
    }

    getFinalizedHeight(): Promise<number> {
        if (this.rpc) {
            return this.rpc.getFinalizedHeight()
        } else {
            return this.createArchive().getFinalizedHeight()
        }
    }

    async getBlockHash(height: number): Promise<Base58Bytes | undefined> {
        if (this.archiveSettings == null) {
            assert(this.rpc)
            return this.rpc.getBlockHash(height)
        } else {
            let archive = this.createArchive()
            let head = await archive.getFinalizedHeight()
            if (head >= height) return archive.getBlockHash(height)
            if (this.rpc) return this.rpc.getBlockHash(height)
        }
    }

    async *streamFinalizedBlocks(fromBlockHeight?: number): AsyncIterable<Block<F>[]> {
        let requests = fromBlockHeight == null
            ? this.requests
            : applyRangeBound(this.requests, {from: fromBlockHeight})

        if (requests.length == 0) return

        if (this.archiveSettings) {
            let agent = new HttpAgent({keepAlive: true})
            try {
                let archive = this.createArchive(agent)
                let height = await archive.getFinalizedHeight()
                let firstBlock = requests[0].range.from
                if (height > firstBlock) {
                    for await (let batch of archive.streamFinalizedBlocks(requests, !this.rpc)) {
                        firstBlock = last(batch).header.height + 1
                        yield batch as Block<F>[]
                    }
                    requests = applyRangeBound(requests, {from: firstBlock})
                    if (requests.length == 0) return
                }
            } finally {
                agent.close()
            }
        }

        assert(this.rpc)

        yield* this.rpc.streamFinalizedBlocks(requests) as AsyncIterable<Block<F>[]>
    }

    private createArchive(agent?: HttpAgent): SolanaArchive {
        assert(this.archiveSettings)

        let http = new HttpClient({
            headers: {
                'x-squid-id': this.getSquidId()
            },
            agent
        })

        return new SolanaArchive(
            new ArchiveClient({
                http,
                url: this.archiveSettings.url,
                queryTimeout: this.archiveSettings.requestTimeout,
            })
        )
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
