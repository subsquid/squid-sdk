import {BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {RangeRequestList, applyRangeBound} from '@subsquid/util-internal-range'

/**
 * Stream an inner RPC source per *request range*, intersected with the caller's `[from, to]`
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
 *
 * `toRef` extracts the chain reference of a raw block — chains whose raw blocks already carry
 * `{number, hash}` (EVM) pass the identity; others (Solana's `{slot, block}`) supply an adapter.
 */
export async function* streamBoundedRanges<B>(
    inner: Pick<DataSource<B>, 'getStream' | 'getFinalizedStream'>,
    requests: RangeRequestList<unknown>,
    req: StreamRequest,
    finalized: boolean,
    toRef: (block: B) => BlockRef,
): BlockStream<B> {
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
                let ref = toRef(last)
                parentHash = ref.hash
                expectedFrom = ref.number + 1
            }
        }

        // The next *contiguous* range begins right after this one; a larger jump is a gap.
        if (range.to != null) expectedFrom = Math.max(expectedFrom, range.to + 1)
    }
}

/**
 * Drop blocks left empty after filtering, matching the Portal — which forwards `includeAllBlocks`
 * to the server and, when it is false, returns only blocks with matching data. A block is kept iff
 * it carries data (`hasData`), its range opted into `includeAllBlocks`, or it is a *boundary*
 * block.
 *
 * The batch's first and last blocks are always kept even when empty, mirroring the Portal: the last
 * block lets the consumer's cursor advance to the batch end (without it, progress would stall on a
 * dataless tail), and the first anchors chain continuity. Keeping them is also what makes a
 * `[Portal, RPC]` fallback transparent — both sides drop the same interior empties.
 */
export function dropEmptyBlocks<B>(
    blocks: B[],
    includeAllBlocks: (blockNumber: number) => boolean,
    blockNumber: (block: B) => number,
    hasData: (block: B) => boolean,
): B[] {
    return blocks.filter((b, i) => {
        if (i === 0 || i === blocks.length - 1) return true // boundary blocks: always present
        if (includeAllBlocks(blockNumber(b))) return true

        return hasData(b)
    })
}
