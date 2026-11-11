import {createLogger} from '@subsquid/logger'
import {concurrentMap, last} from '@subsquid/util-internal'
import {type BlockRef, ForkException} from '@subsquid/util-internal-data-source'
import {splitRange} from '@subsquid/util-internal-range'
import assert from 'node:assert'
import type {Commitment, RpcApi} from '../rpc'
import {getBlockRef} from '../util'
import {getBlocks} from './fetch'
import type {IngestBatch, IngestOptions} from './ingest'

const log = createLogger('sqd:solana-rpc:chain-fixer')

/**
 * Blocks of the new chain reported below a fork, ending at the new parent - the depth the Portal's
 * hot-block service reports in its fork responses. The consumer rolls back to the newest of its
 * blocks that is also in the list; the batch processor keeps only some of its unfinalized blocks,
 * so a list that just reaches the fork point is often not enough.
 */
const FORK_PREVIOUS_BLOCKS = 100
/** Slots searched for those blocks: room for half of them to be skipped. */
const FORK_PREVIOUS_SLOT_SPAN = 2 * FORK_PREVIOUS_BLOCKS

export function ensureContinuity(
    ingest: IngestOptions,
    upstream: AsyncIterable<IngestBatch>,
    from: number,
    parentHash?: string,
    to?: number,
): AsyncIterable<IngestBatch> {
    let stream = new ChainFixer(ingest, from, parentHash).fix(upstream)
    if (to == null) {
        return stream
    }
    return limitUpperBoundary(to, stream)
}

export async function* limitUpperBoundary(
    to: number,
    upstream: AsyncIterable<IngestBatch>,
): AsyncIterable<IngestBatch> {
    for await (let batch of upstream) {
        if (batch.blocks.length === 0) {
            yield batch
            continue
        }

        if (last(batch.blocks).slot >= to) {
            batch.blocks = batch.blocks.filter((b) => b.slot <= to)
            if (batch.blocks.length > 0) {
                yield batch
            }
            return
        }
        yield batch
    }
}

export class ChainFixer {
    constructor(
        private ingest: IngestOptions,
        private from: number,
        private parentHash?: string,
    ) {}

    async *fix(upstream: AsyncIterable<IngestBatch>): AsyncIterable<IngestBatch> {
        for await (let batch of upstream) {
            removeOverlaps(batch)

            let {head, tail} = await this.acceptBatch(batch)

            if (head) {
                yield head
            }

            if (tail) {
                yield* this.fillGap(tail, 1)
            }
        }
    }

    private async *fillGap(batch: IngestBatch, depth: number): AsyncIterable<IngestBatch> {
        if (depth > 3) throw new Error('the data source is too unstable')
        while (true) {
            let to = batch.blocks[0].block.parentSlot
            assert(this.from <= to)

            let gapLog = log.child({from: this.from, to, depth})
            gapLog.debug('got a gap')

            for await (let missingBatch of this.fetch(this.from, to)) {
                let {head, tail} = await this.acceptBatch(missingBatch)

                if (head) {
                    yield head
                }

                if (tail) {
                    yield* this.fillGap(tail, depth + 1)
                }
            }

            // we've covered all the blocks up to `to`,
            // but due to skips, we might not be on `to + 1` position.
            this.from = to + 1

            if (batch.blocks[0].block.previousBlockhash === this.parentHash) {
                gapLog.debug('gap filled')
                let {head, tail} = await this.acceptBatch(batch)
                if (head) {
                    yield head
                }
                if (tail) {
                    batch = tail
                } else {
                    return
                }
            } else {
                // we have a chain break,
                // that means batch blocks, that are linked to the first block where skipped
                let i = 1
                for (; i < batch.blocks.length; i++) {
                    let next = batch.blocks[i]
                    let prev = batch.blocks[i - 1]
                    if (next.block.previousBlockhash !== prev.block.blockhash) {
                        break
                    }
                }
                gapLog.debug({dropped: i, left: batch.blocks.length - 1}, 'gap break')
                if (i < batch.blocks.length) {
                    batch = batchSlice(batch, i)
                } else {
                    return
                }
            }
        }
    }

    private fetch(from: number, to: number): AsyncIterable<IngestBatch> {
        return concurrentMap(
            this.ingest.strideConcurrency,
            splitRange(this.ingest.strideSize, {from, to}),
            async (range) => {
                let blocks = await getBlocks(
                    this.ingest.rpc,
                    this.ingest.commitment,
                    this.ingest.req,
                    range,
                    this.ingest.validateChainContinuity,
                    this.ingest.maxConfirmationAttempts,
                )
                return {blocks}
            },
        )
    }

    private async acceptBatch(batch: IngestBatch): Promise<{
        head?: IngestBatch
        tail?: IngestBatch
    }> {
        // find a boundary of blocks below this.from
        let offset = 0
        while (offset < batch.blocks.length && batch.blocks[offset].slot < this.from) {
            offset += 1
        }

        for (let i = offset; i < batch.blocks.length; i++) {
            let b = batch.blocks[i]
            if (this.from > b.block.parentSlot) {
                if (
                    this.ingest.validateChainContinuity &&
                    this.parentHash &&
                    this.parentHash !== b.block.previousBlockhash
                )
                    throw new ForkException(
                        b.slot,
                        this.parentHash,
                        await getForkPreviousBlocks(
                            this.ingest.rpc,
                            this.ingest.commitment,
                            b.block.parentSlot,
                            b.block.previousBlockhash,
                        ),
                    )
                this.from = b.slot + 1
                this.parentHash = b.block.blockhash
            } else {
                if (i - offset > 0) {
                    return {
                        head: batchSlice(batch, offset, i),
                        tail: batchSlice(batch, i),
                    }
                }
                return {
                    tail: batchSlice(batch, offset),
                }
            }
        }

        if (offset < batch.blocks.length) {
            return {
                head: batchSlice(batch, offset),
            }
        }
        return {}
    }
}

/**
 * The new chain below a block whose parent did not match: from its parent (`parentSlot`,
 * `previousBlockhash`) downwards along parent links, in ascending order, as
 * `ForkException.previousBlocks` expects.
 *
 * A consumer can only roll back to a block that is in both its chain and this list. Reporting just
 * the parent - at the slot of the consumer's replaced head, with a different hash by definition -
 * left the batch processor nothing in common, and every reorg ended in "Unable to process fork".
 *
 * Slots can be skipped, so the chain is followed through `parentSlot` rather than read as a range,
 * and it stops at the first link that does not hold: a node switching branches can still answer
 * some slots from the old one.
 */
export async function getForkPreviousBlocks(
    rpc: RpcApi,
    commitment: Commitment,
    parentSlot: number,
    parentHash: string,
): Promise<BlockRef[]> {
    // Each block's parent link vouches for the block below it, so the walk always ends with that
    // link - even where the node has no header for it, or answers from the old branch.
    let expected: BlockRef = {number: parentSlot, hash: parentHash}
    let chain: BlockRef[] = []

    let slots: number[] = []
    try {
        slots = await rpc.getBlocks(commitment, Math.max(0, parentSlot - FORK_PREVIOUS_SLOT_SPAN + 1), parentSlot)
    } catch (err: any) {
        log.warn({err, parentSlot}, 'could not list the slots below a fork; reporting its parent only')
    }

    // The newest listed slots, top-down, in one request for their headers.
    let candidates = slots
        .filter((s) => s <= parentSlot)
        .sort((a, b) => b - a)
        .slice(0, FORK_PREVIOUS_BLOCKS)
    let headers = candidates.length
        ? await rpc.getBlockBatch(candidates, {
              commitment,
              transactionDetails: 'none',
              rewards: false,
              maxSupportedTransactionVersion: 0,
          })
        : []

    for (let i = 0; i < candidates.length; i++) {
        let slot = candidates[i]
        if (slot > expected.number) continue // a sibling slot, not on this chain
        if (slot < expected.number) break // the expected parent slot is missing
        let header = headers[i]
        if (header == null || header === 'skipped' || header.blockhash !== expected.hash) break
        chain.push(expected)
        // Genesis names its own slot as its parent: there is no block below it to vouch for.
        if (header.parentSlot >= slot) return chain.reverse()
        expected = {number: header.parentSlot, hash: header.previousBlockhash}
    }
    chain.push(expected)
    return chain.reverse()
}

export function removeOverlaps(batch: IngestBatch): void {
    if (batch.blocks.length == 0) return

    let blocks = batch.blocks
    let i = 0
    let j = 1
    while (j < blocks.length) {
        let next = blocks[j]
        while (i >= 0) {
            let prev = blocks[i]
            if (prev.slot < next.block.parentSlot) {
                break
            }
            if (prev.slot === next.block.parentSlot && prev.block.blockhash === next.block.previousBlockhash) {
                break
            }
            i -= 1
        }
        j += 1
        i += 1
        blocks[i] = next
    }
    blocks.length = i + 1
}

function batchSlice(batch: IngestBatch, start?: number, end?: number): IngestBatch {
    let res: IngestBatch = {
        blocks: batch.blocks.slice(start, end),
    }
    if (batch.finalized) {
        res.finalized = {...batch.finalized}
    }
    return res
}
