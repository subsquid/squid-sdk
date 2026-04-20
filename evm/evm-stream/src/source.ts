import {PortalClient, PortalClientOptions} from '@subsquid/portal-client'
import {def} from '@subsquid/util-internal'
import {BlockBatch, BlockRef, DataSource, DataSourceStreamOptions, TemplateRegistry} from '@subsquid/util-internal-data-source'
import {getOrGenerateSquidId} from '@subsquid/util-internal-processor-tools'
import {applyRangeBound, FiniteRange, mergeRangeRequests, Range, rangeIntersection, RangeRequest, RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {PortalDataSource} from './portal/source'
import {Block, DEFAULT_FIELDS, FieldSelection} from './data/model'
import {DataRequest, LogRequest, StateDiffRequest, TraceRequest, TransactionRequest} from './data/request'
import type {Selector} from './data/type-util'

interface BlockRange {
    range?: Range
}

interface TemplateSpec<F extends FieldSelection> {
    key: string
    range?: Range
    resolve(value: string): DataRequest<F>
}

export class DataSourceBuilder<F extends FieldSelection = {}> {
    private requests: RangeRequest<DataRequest<F>>[] = []
    private templates: TemplateSpec<F>[] = []
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

    addLog(options: LogRequest & BlockRange): this
    addLog(key: string, options: LogRequest & BlockRange): this
    addLog(keyOrOptions: string | (LogRequest & BlockRange), options?: LogRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...log} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                logs: [{...log, where: {...log.where, address: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {logs: [req]})
        return this
    }

    addTransaction(options: TransactionRequest & BlockRange): this
    addTransaction(key: string, options: TransactionRequest & BlockRange): this
    addTransaction(keyOrOptions: string | (TransactionRequest & BlockRange), options?: TransactionRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...transaction} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                transactions: [{...transaction, where: {...transaction.where, to: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {transactions: [req]})
        return this
    }

    addTrace(options: TraceRequest & BlockRange): this
    addTrace(key: string, options: TraceRequest & BlockRange): this
    addTrace(keyOrOptions: string | (TraceRequest & BlockRange), options?: TraceRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...trace} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                traces: [{...trace, where: {...trace.where, callTo: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {traces: [req]})
        return this
    }

    addStateDiff(options: StateDiffRequest & BlockRange): this
    addStateDiff(key: string, options: StateDiffRequest & BlockRange): this
    addStateDiff(keyOrOptions: string | (StateDiffRequest & BlockRange), options?: StateDiffRequest & BlockRange): this {
        if (typeof keyOrOptions === 'string') {
            let {range, ...stateDiff} = options!
            this.templates.push({key: keyOrOptions, range, resolve: (value) => ({
                stateDiffs: [{...stateDiff, where: {...stateDiff.where, address: [value]}}],
            })})
            return this
        }
        let {range, ...req} = keyOrOptions
        this.add(range, {stateDiffs: [req]})
        return this
    }

    private getRequests(registry: TemplateRegistry | undefined): RangeRequestList<DataRequest<F>> {

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

        let mergedInputs: RangeRequest<DataRequest<F>>[] = this.requests.slice()

        if (registry) {
            for (let spec of this.templates) {
                for (let entry of registry.get(spec.key)) {
                    let range = rangeIntersection(spec.range ?? {from: 0}, entry.range)
                    if (!range) continue
                    mergedInputs.push({range, request: spec.resolve(entry.value)})
                }
            }
        }

        let requests = mergeRangeRequests(mergedInputs, (a, b) => {
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

        return applyRangeBound(rangeRequests as RangeRequestList<DataRequest<F>>, this.blockRange)
    }

    build(): EVMDataSource<F> {
        assert(this.portal, 'Portal settings not set')

        let portal = this.portal instanceof PortalClient ? this.portal : new PortalClient(this.portal)
        return new EVMDataSource(
            (reg) => this.getRequests(reg),
            portal
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
    constructor(
        private _resolveRequests: (registry: TemplateRegistry | undefined) => RangeRequestList<DataRequest<F>>,
        private portal: PortalClient,
    ) {}

    getHead(): Promise<BlockRef> {
        return this.createArchive().getHead()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.createArchive().getFinalizedHead()
    }

    getFinalizedStream(opts: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this.createArchive().getFinalizedStream(opts)
    }

    getStream(opts?: DataSourceStreamOptions): AsyncIterable<BlockBatch<Block<F>>> {
        return this.createArchive().getStream(opts)
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return this.createArchive().getBlocksCountInRange(range)
    }

    @def
    private createArchive() {
        return new PortalDataSource(this.portal, this._resolveRequests.bind(this), {squidId: this.getSquidId()})
    }

    @def
    private getSquidId(): string {
        return getOrGenerateSquidId()
    }
}
