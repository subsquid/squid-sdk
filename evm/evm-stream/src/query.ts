import type {Range, RangeRequest} from '@subsquid/util-internal-range'
import type {DataRequest, LogRequest, StateDiffRequest, TraceRequest, TransactionRequest} from './data/request'

/**
 * A single portal query - a set of item filters that share a block range.
 *
 * Produced by {@link QueryBuilder#build} and consumed by
 * {@link DataSourceBuilder#addQuery}.
 */
export type Query = RangeRequest<DataRequest>

/**
 * Builder for a single portal query - a set of item filters that share a block range.
 *
 * Pass a {@link QueryBuilder} or the result of {@link QueryBuilder#build}
 * to {@link DataSourceBuilder#addQuery} to register the query.
 *
 * @example
 * ```ts
 * let query = new QueryBuilder()
 *     .setRange({from: 1_000_000})
 *     .addLog({where: {address: [CONTRACT], topic0: [TRANSFER_TOPIC]}})
 *     .addTransaction({where: {to: [CONTRACT]}, include: {logs: true}})
 *
 * dataSource.addQuery(query)
 * ```
 */
export class QueryBuilder {
    private _range: Range = {from: 0}
    private _request: DataRequest = {}

    /**
     * Restrict this query to the given block range.
     *
     * When omitted, the query applies from block 0 onwards.
     */
    setRange(range: Range): this {
        this._range = range
        return this
    }

    /**
     * Fetch every block in the query's range, even blocks without any
     * matching items.  Without this flag such blocks may be omitted.
     */
    includeAllBlocks(): this {
        this._request.includeAllBlocks = true
        return this
    }

    addLog(options: LogRequest): this {
        ;(this._request.logs ??= []).push(options)
        return this
    }

    addTransaction(options: TransactionRequest): this {
        ;(this._request.transactions ??= []).push(options)
        return this
    }

    addTrace(options: TraceRequest): this {
        ;(this._request.traces ??= []).push(options)
        return this
    }

    addStateDiff(options: StateDiffRequest): this {
        ;(this._request.stateDiffs ??= []).push(options)
        return this
    }

    /**
     * Produce an immutable {@link Query} describing the configured range
     * and filters.  Subsequent mutations of this builder do not affect
     * the returned object.
     */
    build(): Query {
        return {
            range: {...this._range},
            request: cloneRequest(this._request),
        }
    }
}

function cloneRequest(request: DataRequest): DataRequest {
    return {
        includeAllBlocks: request.includeAllBlocks,
        logs: request.logs?.slice(),
        transactions: request.transactions?.slice(),
        traces: request.traces?.slice(),
        stateDiffs: request.stateDiffs?.slice(),
    }
}
