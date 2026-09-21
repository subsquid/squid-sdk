import {PortalClient, type PortalClientOptions} from '@subsquid/portal-client'
import {type Range, type RangeRequest, type RangeRequestList, applyRangeBound, mergeRangeRequests} from '@subsquid/util-internal-range'
import assert from 'assert'
import type {FieldSelection} from './data/model'
import type {DataRequest, LogRequest, StateDiffRequest, TraceRequest, TransactionRequest} from './data/request'
import {PortalEvmDataSource} from './portal/source'
import {type Query, QueryBuilder} from './query'
import type {EVMDataSource} from './source'

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
     * source.setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet')
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
     *     .setRange({from: 1_000_000})
     *     .addLog({where: {address: [CONTRACT], topic0: [TRANSFER_TOPIC]}})
     *     .addTransaction({where: {to: [CONTRACT]}, include: {logs: true}})
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
     * contains a single trace filter.
     */
    addTrace(options: TraceRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {traces: [req]},
        })
    }

    /**
     * Shorthand for {@link DataSourceBuilder#addQuery} with a query that
     * contains a single state diff filter.
     */
    addStateDiff(options: StateDiffRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({
            range: range ?? {from: 0},
            request: {stateDiffs: [req]},
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
                logs: concat(a.logs, b.logs),
                transactions: concat(a.transactions, b.transactions),
                traces: concat(a.traces, b.traces),
                stateDiffs: concat(a.stateDiffs, b.stateDiffs),
            }
        })

        return applyRangeBound(requests, this.blockRange)
    }

    build(): EVMDataSource<F> {
        assert(this.portal, 'Portal settings not set')

        let portal = this.portal instanceof PortalClient ? this.portal : new PortalClient(this.portal)
        return new PortalEvmDataSource<F>(portal, (this.fields ?? {}) as F, this.getRequests())
    }
}
