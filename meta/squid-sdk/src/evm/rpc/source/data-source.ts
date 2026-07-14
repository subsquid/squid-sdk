import {mapRpcBlock} from '@subsquid/evm-normalization'
import {Block, DataRequest, FieldSelection} from '@subsquid/evm-stream'
import {EvmRpcDataSource, Rpc, DataRequest as RpcDataRequest, Block as RpcBlock} from '@subsquid/evm-rpc'
import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {FiniteRange, RangeRequest, RangeRequestList, applyRangeBound, getSize} from '@subsquid/util-internal-range'

import {decodeBlock} from '../decode/decode'
import {filterBlock, setUpRelations} from '../filter/filter'
import {FlatDataRequest, flattenRequest, unionRequiredData} from '../filter/request'
import {augmentFields} from './augment'

/**
 * RPC method-selection + data toggles that aren't derivable from the query — they depend on
 * the chain / provider (the deploy-config layer). Supplied by per-network
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
 * matching the Portal. `includeAllBlocks` is honored like the Portal: when it is false for a
 * block's range, a block left empty by filtering is dropped (see {@link dropEmptyBlocks}).
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
        let augmented = augmentFields(options.fields, this.flatRequests.map((r) => r.request))
        this.augmentedFields = augmented.fields
        this.needsProjection = augmented.grew

        let coarse = unionRequiredData(this.flatRequests.map((r) => r.request), options.fields)
        this.withTraces = coarse.traces
        this.withStateDiffs = coarse.stateDiffs

        let req: RpcDataRequest = {
            // Always fetch full transaction objects: mapRpcBlock maps the block's transactions
            // unconditionally (and traces/stateDiffs are correlated to them), so a hashes-only
            // block fetch can't be normalized. This is why `RequiredData` carries no `transactions`
            // toggle — it could never be false, so deriving it would be dead.
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
        for await (let batch of streamBoundedRanges(this.inner, this.requests, req, true)) {
            yield this.mapBatch(batch)
        }
    }

    async *getStream(req: StreamRequest): BlockStream<Block<F>> {
        for await (let batch of streamBoundedRanges(this.inner, this.requests, req, false)) {
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
        let blocks = batch.blocks.map((raw) => this.mapBlock(raw))

        return {
            blocks: dropEmptyBlocks(blocks, (n) => this.flatRequestFor(n)?.includeAllBlocks ?? false),
            finalizedHead: batch.finalizedHead,
        }
    }

    private mapBlock(raw: RpcBlock): Block<F> {
        let normalized = mapRpcBlock(raw, {withTraces: this.withTraces, withStateDiffs: this.withStateDiffs})
        let filtered = decodeBlock(normalized, this.augmentedFields)

        // The augmented decode's item arrays align 1:1 by index with a decode of the *same*
        // normalized block at exactly `F`: field selection changes each item's fields, never how
        // many items there are or their order. Snapshot them before filtering so the surviving
        // positions can be recovered by object identity (used by the projection below).
        let preLogs = filtered.logs
        let preTransactions = filtered.transactions
        let preTraces = filtered.traces
        let preStateDiffs = filtered.stateDiffs

        let flat = this.flatRequestFor(filtered.header.number)
        if (flat) {
            filterBlock(filtered, flat, setUpRelations(filtered))
        }

        if (!this.needsProjection) {
            return filtered as Block<F>
        }

        // A `where` clause referenced a field not selected for output, so `filtered` is a superset
        // of `F`. Decode again at exactly `F` (the Portal shape) and keep the items whose pre-filter
        // position survived. Keying on position/identity — not a synthesized structural key — so
        // items that would share such a key (block-reward traces carry no `transactionIndex`) can't
        // collide and project the wrong one.
        let projected = decodeBlock(normalized, this.fields)
        projected.logs = keptByPosition(projected.logs, preLogs, filtered.logs)
        projected.transactions = keptByPosition(projected.transactions, preTransactions, filtered.transactions)
        projected.traces = keptByPosition(projected.traces, preTraces, filtered.traces)
        projected.stateDiffs = keptByPosition(projected.stateDiffs, preStateDiffs, filtered.stateDiffs)

        return projected
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

/**
 * Keep the items of `projected` whose positionally-aligned item in `pre` (the pre-filter decode of
 * the same block) survived filtering into `kept`. `projected[i]` and `pre[i]` are the same on-chain
 * item decoded at two field selections, so a surviving `pre[i]` means `projected[i]` is kept. Using
 * position + identity avoids the collisions a synthesized structural key would hit for items that
 * share one (e.g. block-reward traces, which carry no `transactionIndex`).
 */
export function keptByPosition<P, Q>(projected: P[], pre: Q[], kept: Q[]): P[] {
    let survived = new Set(kept)

    return projected.filter((_, i) => survived.has(pre[i]))
}


/**
 * Stream the inner RPC source per *request range*, intersected with the caller's `[from, to]`
 * window — exactly like the Portal source, which issues one query per range. Blocks in a gap
 * between non-contiguous ranges are never streamed, so they can't leak through unfiltered: that
 * would break the Portal-compatible / drop-in guarantee and disagree with `getBlocksCountInRange`,
 * which counts only the request ranges.
 *
 * `parentHash` is threaded through *contiguous* ranges so the inner source's continuity/fork
 * detection keeps working across a seam, and is dropped across a gap (there is no parent to
 * assert there). The caller's `parentHash` is preserved for the very first streamed block *when the
 * stream starts within the first request range* (no leading gap) — that is what lets a fallback
 * detect a fork when it resumes after switching sources. If the stream instead starts inside a gap
 * (`range.from !== expectedFrom` on the first range), there is no asserted parent, so it is dropped.
 */
export async function* streamBoundedRanges(
    inner: Pick<DataSource<RpcBlock>, 'getStream' | 'getFinalizedStream'>,
    requests: RangeRequestList<unknown>,
    req: StreamRequest,
    finalized: boolean,
): BlockStream<RpcBlock> {
    let ranges = applyRangeBound(requests, {from: req.from, to: req.to})

    let parentHash = req.parentHash
    let expectedFrom = req.from

    for (let {range} of ranges) {
        // A gap precedes this range (or the stream starts inside one): don't hand the inner source
        // a parentHash it would treat as a fork.
        if (range.from !== expectedFrom) parentHash = undefined

        let streamReq: StreamRequest = {from: range.from, to: range.to, parentHash}
        let stream = finalized ? inner.getFinalizedStream(streamReq) : inner.getStream(streamReq)

        for await (let batch of stream) {
            yield batch

            let last = batch.blocks[batch.blocks.length - 1]
            if (last) {
                parentHash = last.hash
                expectedFrom = last.number + 1
            }
        }

        // The next *contiguous* range begins right after this one; a larger jump is a gap.
        if (range.to != null) expectedFrom = Math.max(expectedFrom, range.to + 1)
    }
}

type AnyDecodedBlock = {header: {number: number}; logs: unknown[]; transactions: unknown[]; traces: unknown[]; stateDiffs: unknown[]}

/**
 * Drop blocks left empty after filtering, matching the Portal — which forwards `includeAllBlocks`
 * to the server and, when it is false, returns only blocks with matching data. A block is kept iff
 * it carries data, its range opted into `includeAllBlocks`, or it is a *boundary* block.
 *
 * The batch's first and last blocks are always kept even when empty, mirroring the Portal: the last
 * block lets the consumer's cursor advance to the batch end (without it, progress would stall on a
 * dataless tail), and the first anchors chain continuity. Keeping them is also what makes a
 * `[Portal, RPC]` fallback transparent — both sides drop the same interior empties.
 */
export function dropEmptyBlocks<B extends AnyDecodedBlock>(
    blocks: B[],
    includeAllBlocks: (blockNumber: number) => boolean,
): B[] {
    return blocks.filter((b, i) => {
        if (i === 0 || i === blocks.length - 1) return true // boundary blocks: always present
        if (includeAllBlocks(b.header.number)) return true

        return b.logs.length > 0 || b.transactions.length > 0 || b.traces.length > 0 || b.stateDiffs.length > 0
    })
}

// Re-export so the bounded-stream consumer can apply request range bounds the same way.
export {applyRangeBound}
