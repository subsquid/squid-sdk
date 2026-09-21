import {PortalClient, PortalClientOptions} from '@subsquid/portal-client'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {FieldSelection} from './data/model'
import {
    BalanceRequest,
    DataRequest,
    InstructionRequest,
    LogRequest,
    RewardRequest,
    TokenBalanceRequest,
    TransactionRequest,
} from './data/request'
import {PortalSolanaDataSource} from './portal/source'
import {type Query, QueryBuilder} from './query'
import type {SolanaDataSource} from './source'

interface BlockRange {
    range?: Range
}

export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private portal?: PortalClient | PortalClientOptions

    /**
     * Set SQD Network Portal endpoint.
     *
     * SQD Network allows to get data from blocks up to
     * infinite times faster and more efficient than via regular RPC.
     *
     * @example
     * source.setPortal('https://portal.sqd.dev/datasets/solana-mainnet')
     */
    setPortal(portal: string | PortalClientOptions | PortalClient): this {
        if (typeof portal == 'string') {
            this.portal = {url: portal}
        } else {
            this.portal = portal
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

    /**
     * Add a portal query - a set of item filters that share a block range.
     *
     * Accepts either a prebuilt {@link Query} object or a
     * {@link QueryBuilder}, in which case {@link QueryBuilder#build} is
     * invoked automatically.
     *
     * @example
     * ```ts
     * source.addQuery(new QueryBuilder()
     *     .setRange({from: 250_000_000})
     *     .addInstruction({where: {programId: [PROGRAM_ID]}, include: {logs: true}})
     *     .addTransaction({where: {feePayer: [FEE_PAYER]}})
     * )
     * ```
     */
    addQuery(query: Query | QueryBuilder): this {
        this.requests.push(query instanceof QueryBuilder ? query.build() : query)
        return this
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * only sets {@link QueryBuilder#includeAllBlocks} (and optionally a
     * range).
     */
    includeAllBlocks(range?: Range): this {
        return this.addQuery({
            range: range ?? {from: 0},
            request: {includeAllBlocks: true},
        })
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * contains a single transaction filter.
     */
    addTransaction(options: TransactionRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {transactions: [req]},
        })
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * contains a single instruction filter.
     */
    addInstruction(options: InstructionRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {instructions: [req]},
        })
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * contains a single log filter.
     */
    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {logs: [req]},
        })
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * contains a single balance filter.
     */
    addBalance(options: BalanceRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {balances: [req]},
        })
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * contains a single token balance filter.
     */
    addTokenBalance(options: TokenBalanceRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {tokenBalances: [req]},
        })
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * contains a single reward filter.
     */
    addReward(options: RewardRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {rewards: [req]},
        })
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
                rewards: concat(a.rewards, b.rewards),
            }
        })

        return applyRangeBound(requests, this.blockRange)
    }

    build(): SolanaDataSource<F> {
        assert(this.portal, 'Portal settings not set')

        let portal = this.portal instanceof PortalClient ? this.portal : new PortalClient(this.portal)
        return new PortalSolanaDataSource<F>(portal, (this.fields ?? {}) as F, () => this.getRequests(), {
            squidId: getOrGenerateSquidId(),
        })
    }
}
