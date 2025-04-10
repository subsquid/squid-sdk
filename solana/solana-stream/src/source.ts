import {def} from '@subsquid/util-internal'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {
    applyRangeBound,
    mergeRangeRequests,
    Range,
    RangeRequest,
    RangeRequestList,
} from '@subsquid/util-internal-range'
import assert from 'assert'
import {getFields} from './data/fields'
import {Block, FieldSelection} from './data/model'
import {
    BalanceRequest,
    DataRequest,
    InstructionRequest,
    LogRequest,
    RewardRequest,
    TokenBalanceRequest,
    TransactionRequest,
} from './data/request'
import {PortalDataSource} from './archive/source'
import {PortalClient, PortalClientOptions} from '@subsquid/portal-client'
import {BlockBatch, BlockRef, DataSource, DataSourceStream, DataSourceStreamOptions} from '@subsquid/util-internal-data-source'

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
    private archive?: PortalClient | PortalClientOptions

    /**
     * Set SQD Network Portal endpoint.
     *
     * SQD Network allows to get data from blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * source.setGateway('https://portal.sqd.dev/datasets/solana-mainnet')
     */
    setPortal(portal: string | PortalClientOptions | PortalClient): this {
        if (typeof portal == 'string') {
            this.archive = {url: portal}
        } else {
            this.archive = portal
        }
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
        assert(this.archive, 'Portal settings not set')

        return new SolanaDataSource(
            this.getRequests(),
            this.archive,
        ) as DataSource<Block<F>>
    }
}

export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never

export class SolanaDataSource<F extends FieldSelection = {}, B extends Block<F> = Block<F>> implements DataSource<B> {
    private portal: PortalClient
    
    constructor(
        private requests: RangeRequestList<DataRequest>,
        portal: PortalClient | PortalClientOptions,
    ) {
        this.portal = portal instanceof PortalClient ? portal : new PortalClient(portal)
    }

    getHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getHead()
    }

    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getFinalizedHead()
    }

    getFinalizedStream(opts: DataSourceStreamOptions): DataSourceStream<B> {
        return this._getStream(opts, true)
    }

    getStream(opts?: DataSourceStreamOptions): DataSourceStream<B> {
        return this._getStream(opts, false)
    }

    private async *_getStream(opts?: DataSourceStreamOptions, finalized?: boolean): DataSourceStream<B> {
        let archive = this.createArchive()

        let stream = finalized
            ? archive.getFinalizedStream(opts)
            : archive.getStream(opts)

        for await (let batch of stream) {
            yield batch as BlockBatch<B>
        }
    }

    private createArchive() {
        return new PortalDataSource(
            this.portal,
            this.requests,
            {squidId: this.getSquidId()},
        )
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
