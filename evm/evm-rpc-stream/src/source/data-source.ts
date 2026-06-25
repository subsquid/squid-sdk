import {mapRpcBlock} from '@subsquid/evm-normalization'
import {Block, DataRequest, FieldSelection} from '@subsquid/evm-stream'
import {EvmRpcDataSource, Rpc, DataRequest as RpcDataRequest, Block as RpcBlock} from '@subsquid/evm-rpc'
import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {FiniteRange, RangeRequest, RangeRequestList, applyRangeBound, getSize} from '@subsquid/util-internal-range'

import {decodeBlock} from '../decode/decode'
import {filterBlock, setUpRelations} from '../filter/filter'
import {FlatDataRequest, flattenRequest, toRequiredData} from '../filter/request'
import {augmentFields} from './augment'

/**
 * RPC method-selection + data toggles that aren't derivable from the query — they depend on
 * the chain / provider (the "C1" deploy-config layer, plan §S5). Supplied by per-network
 * presets; merged into the coarse evm-rpc `DataRequest`.
 */
export interface RpcMethodOptions {
    useTraceApi?: boolean
    useDebugTraceBlockByNumber?: boolean
    useDebugApiForStateDiffs?: boolean
    debugTraceTimeout?: string
}

export interface EvmRpcStreamOptions<F extends FieldSelection> {
    rpc: Rpc
    fields: F
    requests: RangeRequestList<DataRequest>
    method?: RpcMethodOptions
    strideSize?: number
    strideConcurrency?: number
}

/**
 * An RPC-backed `DataSource<Block<F>>` whose output matches the Portal source's. It delegates
 * streaming, finality tracking, continuity and fork detection to `@subsquid/evm-rpc`'s
 * `EvmRpcDataSource` (which throws the same `ForkException` the processor handles), then maps
 * every raw block through the reused Portal decoder (`decodeBlock`) and the ported client-side
 * filter engine (`filterBlock`) so the result is shaped exactly as the Portal source produces.
 *
 * Client-side filtering augments the field selection with the fields its `where` clauses
 * reference, so an intermediate block can be a *superset* of `fields` when a filter targets an
 * unselected field. When that happens the data source re-decodes at exactly `fields` and projects
 * the augmented fields back out (`projectKept`), so the yielded block carries exactly `fields` —
 * matching the Portal. `includeAllBlocks:false` (dropping empty blocks) remains a noted refinement;
 * `includeAllBlocks:true` semantics are used.
 */
export class EvmRpcStreamDataSource<F extends FieldSelection> implements DataSource<Block<F>> {
    private inner: EvmRpcDataSource
    private fields: F
    private augmentedFields: FieldSelection
    private requests: RangeRequestList<DataRequest>
    private flatRequests: {range: RangeRequest<DataRequest>['range']; request: FlatDataRequest}[]
    private withTraces: boolean
    private withStateDiffs: boolean
    /** True when filter-field augmentation added fields beyond `fields`, so we must project back. */
    private needsProjection: boolean

    constructor(options: EvmRpcStreamOptions<F>) {
        this.fields = options.fields
        this.requests = options.requests
        this.flatRequests = options.requests.map((r) => ({range: r.range, request: flattenRequest(r.request)}))
        this.augmentedFields = augmentFields(options.fields, this.flatRequests.map((r) => r.request))
        this.needsProjection = selectionGrew(this.augmentedFields, options.fields)

        let coarse = unionRequiredData(this.flatRequests.map((r) => r.request), options.fields)
        this.withTraces = coarse.traces
        this.withStateDiffs = coarse.stateDiffs

        let req: RpcDataRequest = {
            // Always fetch full transaction objects: mapRpcBlock maps the block's transactions
            // unconditionally (and traces/stateDiffs are correlated to them), so a hashes-only
            // block fetch can't be normalized.
            transactions: true,
            logs: coarse.logs,
            receipts: coarse.receipts,
            traces: coarse.traces,
            stateDiffs: coarse.stateDiffs,
            useTraceApi: options.method?.useTraceApi,
            useDebugTraceBlockByNumber: options.method?.useDebugTraceBlockByNumber,
            useDebugApiForStateDiffs: options.method?.useDebugApiForStateDiffs,
            debugTraceTimeout: options.method?.debugTraceTimeout,
        }

        this.inner = new EvmRpcDataSource({
            rpc: options.rpc,
            req,
            strideSize: options.strideSize,
            strideConcurrency: options.strideConcurrency,
        })
    }

    getHead(): Promise<BlockRef> {
        return this.inner.getHead()
    }

    getFinalizedHead(): Promise<BlockRef> {
        return this.inner.getFinalizedHead()
    }

    async *getFinalizedStream(req: StreamRequest): BlockStream<Block<F>> {
        for await (let batch of this.inner.getFinalizedStream(req)) {
            yield this.mapBatch(batch)
        }
    }

    async *getStream(req: StreamRequest): BlockStream<Block<F>> {
        for await (let batch of this.inner.getStream(req)) {
            yield this.mapBatch(batch)
        }
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize(
            this.requests.map((r) => r.range),
            range,
        )
    }

    private mapBatch(batch: BlockBatch<RpcBlock>): BlockBatch<Block<F>> {
        return {
            blocks: batch.blocks.map((raw) => this.mapBlock(raw)),
            finalizedHead: batch.finalizedHead,
        }
    }

    private mapBlock(raw: RpcBlock): Block<F> {
        let normalized = mapRpcBlock(raw, {withTraces: this.withTraces, withStateDiffs: this.withStateDiffs})
        let filtered = decodeBlock(normalized, this.augmentedFields)

        let flat = this.flatRequestFor(filtered.header.number)
        if (flat) {
            filterBlock(filtered, flat, setUpRelations(filtered))
        }

        if (!this.needsProjection) {
            return filtered as Block<F>
        }

        // A `where` clause referenced a field not selected for output, so `filtered` is a superset
        // of `F`. Decode again at exactly `F` (the Portal shape) and keep only the filtered items,
        // matched by their structural index keys.
        let projected = decodeBlock(normalized, this.fields)

        return projectKept(projected, filtered) as Block<F>
    }

    private flatRequestFor(blockNumber: number): FlatDataRequest | undefined {
        for (let {range, request} of this.flatRequests) {
            if (range.from <= blockNumber && (range.to == null || blockNumber <= range.to)) {
                return request
            }
        }

        return undefined
    }
}

const SELECTION_TYPES = ['block', 'transaction', 'log', 'trace', 'stateDiff'] as const

/** True if `augmented` selects any field that `original` does not (augmentation only adds). */
function selectionGrew(augmented: FieldSelection, original: FieldSelection): boolean {
    for (let t of SELECTION_TYPES) {
        let aug = (augmented as any)[t] ?? {}
        let orig = (original as any)[t] ?? {}
        for (let k in aug) {
            if (aug[k] && !orig[k]) return true
        }
    }

    return false
}

const traceKey = (t: any) => `${t.transactionIndex}:${(t.traceAddress ?? []).join(',')}`
const stateDiffKey = (d: any) => `${d.transactionIndex}:${d.address}:${d.key}`

/** Keep only the items of `projected` whose structural index appears in the `filtered` block. */
function projectKept(projected: Block<any>, filtered: Block<any>): Block<any> {
    let logs = new Set(filtered.logs.map((l: any) => l.logIndex))
    let transactions = new Set(filtered.transactions.map((t: any) => t.transactionIndex))
    let traces = new Set(filtered.traces.map(traceKey))
    let stateDiffs = new Set(filtered.stateDiffs.map(stateDiffKey))

    projected.logs = projected.logs.filter((l: any) => logs.has(l.logIndex))
    projected.transactions = projected.transactions.filter((t: any) => transactions.has(t.transactionIndex))
    projected.traces = projected.traces.filter((t: any) => traces.has(traceKey(t)))
    projected.stateDiffs = projected.stateDiffs.filter((d: any) => stateDiffs.has(stateDiffKey(d)))

    return projected
}

function unionRequiredData(requests: FlatDataRequest[], fields: FieldSelection) {
    let acc = {transactions: false, logs: false, receipts: false, traces: false, stateDiffs: false}
    for (let req of requests) {
        let r = toRequiredData(req, fields)
        acc.transactions ||= r.transactions
        acc.logs ||= r.logs
        acc.receipts ||= r.receipts
        acc.traces ||= r.traces
        acc.stateDiffs ||= r.stateDiffs
    }

    return acc
}

// Re-export so the bounded-stream consumer can apply request range bounds the same way.
export {applyRangeBound}
