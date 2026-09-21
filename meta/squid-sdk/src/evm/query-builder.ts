import {
    type DataRequest,
    type LogRequest,
    type Query,
    QueryBuilder,
    type StateDiffRequest,
    type TraceRequest,
    type TransactionRequest,
    type FieldSelection,
} from '@subsquid/evm-stream'
import {type Range, type RangeRequest, type RangeRequestList, applyRangeBound, mergeRangeRequests} from '@subsquid/util-internal-range'

interface BlockRange {
    range?: Range
}

/**
 * The shared fluent query surface — field selection + item filters + block range — mirroring
 * `@subsquid/evm-stream`'s `DataSourceBuilder`. Base of {@link EvmRpcDataSourceBuilder} and
 * `EvmFallbackDataSourceBuilder` so both read identically. `setFields` lives on each subclass (it
 * re-types the builder to infer the block type); everything else is shared here. Not instantiated
 * directly.
 */
export abstract class EvmQueryBuilder {
    protected fields: FieldSelection = {}
    protected requests: RangeRequest<DataRequest>[] = []
    protected blockRange?: Range

    /** Limit the range of blocks to fetch. */
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

    /** Shorthand for {@link addQuery} with a single log filter. */
    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {logs: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single transaction filter. */
    addTransaction(options: TransactionRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {transactions: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single trace filter. */
    addTrace(options: TraceRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {traces: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single state-diff filter. */
    addStateDiff(options: StateDiffRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {stateDiffs: [req]}})
    }

    /** Merge + range-bound the accumulated queries (mirrors DataSourceBuilder#getRequests). */
    protected getRequests(): RangeRequestList<DataRequest> {
        function concat<T>(a?: T[], b?: T[]): T[] | undefined {
            let result = [...(a ?? []), ...(b ?? [])]
            return result.length === 0 ? undefined : result
        }

        let requests = mergeRangeRequests(this.requests, (a, b) => ({
            includeAllBlocks: a.includeAllBlocks || b.includeAllBlocks,
            logs: concat(a.logs, b.logs),
            transactions: concat(a.transactions, b.transactions),
            traces: concat(a.traces, b.traces),
            stateDiffs: concat(a.stateDiffs, b.stateDiffs),
        }))

        return applyRangeBound(requests, this.blockRange)
    }
}
