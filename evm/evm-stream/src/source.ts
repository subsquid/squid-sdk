import {PortalClient, PortalClientOptions} from '@subsquid/portal-client'
import {def} from '@subsquid/util-internal'
import {BlockBatch, BlockRef, DataSource, DataSourceStreamOptions} from '@subsquid/util-internal-data-source'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, mergeRangeRequests, Range, RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {PortalDataSource} from './portal/source'
import {Block, DEFAULT_FIELDS, FieldSelection} from './data/model'
import {DataRequest, LogRequest, StateDiffRequest, TraceRequest, TransactionRequest} from './data/request'
import type {Selector} from './data/type-util'

interface BlockRange {
    range?: Range
}

export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest<F>>[] = []
    private fields?: F
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
        this.fields = fields as any
        return this as any
    }

    private add(range: Range | undefined, request: DataRequest<F>): void {
        this.requests.push({
            range: range || {from: 0},
            request,
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

    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            logs: [req],
        })
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            transactions: [req],
        })
        return this
    }

    addTrace(options: TraceRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            traces: [req],
        })
        return this
    }

    addStateDiff(options: StateDiffRequest & BlockRange): this {
        let {range, ...req} = options
        this.add(range, {
            stateDiffs: [req],
        })
        return this
    }

    private getRequests(): RangeRequestList<DataRequest<any>> {
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

        let fields = addDefaultFields(this.fields)

        let rangeRequests = requests.map(({range, request}) => {
            return {
                range,
                request: {
                    fields,
                    ...request,
                },
            }
        })

        return applyRangeBound(rangeRequests, this.blockRange)
    }

    build(): DataSource<Block<F>> {
        assert(this.portal, 'Portal settings not set')

        return new EVMDataSource(
            this.getRequests(),
            this.portal instanceof PortalClient ? this.portal : new PortalClient(this.portal)
        )
    }
}

function addDefaultFields(fields?: FieldSelection): FieldSelection {
    return {
        block: mergeDefaultFields(DEFAULT_FIELDS.block, fields?.block),
        transaction: mergeDefaultFields(DEFAULT_FIELDS.transaction, fields?.transaction),
        log: mergeDefaultFields(DEFAULT_FIELDS.log, fields?.log),
        trace: mergeDefaultFields(DEFAULT_FIELDS.trace, fields?.trace),
        stateDiff: {...mergeDefaultFields(DEFAULT_FIELDS.stateDiff, fields?.stateDiff), kind: true},
    }
}

function mergeDefaultFields<Props extends string>(
    defaults: Selector<Props>,
    selection?: Selector<Props>
): Selector<Props> {
    let result: Selector<Props> = {...defaults}
    for (let key in selection) {
        if (selection[key] != null) {
            if (selection[key]) {
                result[key] = true
            } else {
                delete result[key]
            }
        }
    }
    return result
}

export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never

export class EVMDataSource<F extends FieldSelection> implements DataSource<Block<F>> {
    constructor(private requests: RangeRequestList<DataRequest<F>>, private portal: PortalClient) {}

    getHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getHead()
    }

    getFinalizedHead(): Promise<BlockRef | undefined> {
        return this.createArchive().getFinalizedHead()
    }

    getFinalizedStream(opts: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, true)
    }

    getStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this._getStream(opts, false)
    }

    private _getStream(opts?: DataSourceStreamOptions, finalized?: boolean): AsyncIterable<BlockBatch<Block<F>>> {
        let archive = this.createArchive()

        return finalized ? archive.getFinalizedStream(opts) : archive.getStream(opts)
    }

    @def
    private createArchive() {
        return new PortalDataSource(this.portal, this.requests, {squidId: this.getSquidId()})
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
