import {
    type BalanceRequest,
    type DataRequest,
    type FieldSelection,
    type InstructionRequest,
    type LogRequest,
    type Query,
    QueryBuilder,
    type RewardRequest,
    type TokenBalanceRequest,
    type TransactionRequest,
} from '@subsquid/solana-stream'
import {type Range, type RangeRequest, type RangeRequestList, applyRangeBound, mergeRangeRequests} from '@subsquid/util-internal-range'

interface BlockRange {
    range?: Range
}

/**
 * The shared fluent query surface — field selection + item filters + block range — mirroring
 * `@subsquid/solana-stream`'s `DataSourceBuilder`. Base of {@link SolanaRpcDataSourceBuilder} and
 * `SolanaFallbackDataSourceBuilder` so both read identically. `setFields` lives on each subclass
 * (it re-types the builder to infer the block type); everything else is shared here. Not
 * instantiated directly.
 */
export abstract class SolanaQueryBuilder {
    protected fields: FieldSelection = {}
    protected requests: RangeRequest<DataRequest>[] = []
    protected blockRange?: Range

    /** Limit the range of blocks (slots) to fetch. */
    setBlockRange(range?: Range): this {
        this.blockRange = range
        return this
    }

    /** Add a query — a set of item filters sharing a block range (accepts a {@link QueryBuilder}). */
    addQuery(query: Query | QueryBuilder): this {
        this.requests.push(query instanceof QueryBuilder ? query.build() : query)
        return this
    }

    /** Shorthand for {@link addQuery} that only sets `includeAllBlocks` (and optionally a range). */
    includeAllBlocks(range?: Range): this {
        return this.addQuery({range: range ?? {from: 0}, request: {includeAllBlocks: true}})
    }

    /** Shorthand for {@link addQuery} with a single transaction filter. */
    addTransaction(options: TransactionRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {transactions: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single instruction filter. */
    addInstruction(options: InstructionRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {instructions: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single log filter. */
    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {logs: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single native-balance filter. */
    addBalance(options: BalanceRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {balances: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single token-balance filter. */
    addTokenBalance(options: TokenBalanceRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {tokenBalances: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single reward filter. */
    addReward(options: RewardRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {rewards: [req]}})
    }

    /** Merge + range-bound the accumulated queries (mirrors DataSourceBuilder#getRequests). */
    protected getRequests(): RangeRequestList<DataRequest> {
        function concat<T>(a?: T[], b?: T[]): T[] | undefined {
            let result = [...(a ?? []), ...(b ?? [])]
            return result.length === 0 ? undefined : result
        }

        let requests = mergeRangeRequests(this.requests, (a, b) => ({
            includeAllBlocks: a.includeAllBlocks || b.includeAllBlocks,
            transactions: concat(a.transactions, b.transactions),
            instructions: concat(a.instructions, b.instructions),
            logs: concat(a.logs, b.logs),
            balances: concat(a.balances, b.balances),
            tokenBalances: concat(a.tokenBalances, b.tokenBalances),
            rewards: concat(a.rewards, b.rewards),
        }))

        return applyRangeBound(requests, this.blockRange)
    }
}
