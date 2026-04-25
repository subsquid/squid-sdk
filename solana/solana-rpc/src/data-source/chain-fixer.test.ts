import {describe, expect, it} from 'vitest'
import type {Block} from '../types'
import {ChainFixer, limitUpperBoundary, removeOverlaps} from './chain-fixer'
import type {IngestBatch, IngestOptions} from './ingest'

// Minimal Solana block stub. ChainFixer internals read slot, block.blockhash,
// block.parentSlot, and block.previousBlockhash — everything else stays
// undefined.
function mkBlock(slot: number, blockhash: string, parentSlot: number, previousBlockhash: string): Block {
    return {
        slot,
        block: {blockhash, parentSlot, previousBlockhash} as Block['block'],
    }
}

async function* yieldBatches(...batches: IngestBatch[]): AsyncIterable<IngestBatch> {
    for (const b of batches) yield b
}

async function drain<T>(iter: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = []
    for await (const item of iter) out.push(item)
    return out
}

describe('removeOverlaps', () => {
    it('leaves a clean continuous batch untouched', () => {
        const batch: IngestBatch = {
            blocks: [mkBlock(1, 'h1', 0, 'h0'), mkBlock(2, 'h2', 1, 'h1'), mkBlock(3, 'h3', 2, 'h2')],
        }

        removeOverlaps(batch)

        expect(batch.blocks.map((b) => b.slot)).toEqual([1, 2, 3])
    })

    it('collapses mid-chain duplicates (same slot and hash) into a single entry', () => {
        // Chain: 1 → 2 → 2-dup → 3. The duplicate at slot 2 is walked back
        // to its canonical position, then block 3 reconnects through the
        // surviving slot-2 entry.
        const batch: IngestBatch = {
            blocks: [
                mkBlock(1, 'h1', 0, 'h0'),
                mkBlock(2, 'h2', 1, 'h1'),
                mkBlock(2, 'h2', 1, 'h1'), // exact duplicate
                mkBlock(3, 'h3', 2, 'h2'),
            ],
        }

        removeOverlaps(batch)

        expect(batch.blocks.map((b) => b.slot)).toEqual([1, 2, 3])
    })

    it('removes an alt-branch block mid-batch; block before it survives', () => {
        // [main 1, main 2, alt 3]: alt-3 carries parentSlot=2 but a mismatched
        // previousBlockhash. The algorithm walks back from alt-3:
        //   - prev slot=2 matches parentSlot but hash differs → i-=1
        //   - prev slot=1 is BELOW parentSlot=2 → break out
        // Alt-3 gets written at blocks[1], overwriting the real block 2; the
        // result is [main 1, alt-3]. Notably the surviving "chain" isn't
        // structurally continuous (gap at slot 2) — removeOverlaps enforces
        // parent-hash continuity only relative to the last-accepted suffix,
        // not the whole array.
        const batch: IngestBatch = {
            blocks: [mkBlock(1, 'h1', 0, 'h0'), mkBlock(2, 'h2', 1, 'h1'), mkBlock(3, 'h3-alt', 2, 'h2-alt')],
        }

        removeOverlaps(batch)

        expect(batch.blocks.map((b) => b.slot)).toEqual([1, 3])
        expect(batch.blocks.map((b) => b.block.blockhash)).toEqual(['h1', 'h3-alt'])
    })

    it('collapses to the single latest block when the whole batch is alt-branch relative to itself', () => {
        // Nothing in this batch chains through anything else — each block
        // claims a parent none of its predecessors can satisfy. The walk-
        // back hits i=-1 on every step and `blocks[i] = next` overwrites
        // blocks[0] each time, so the final array holds just the last
        // block in input order.
        const batch: IngestBatch = {
            blocks: [
                mkBlock(1, 'a1', 0, 'unknown'),
                mkBlock(2, 'a2', 1, 'different-from-a1'),
                mkBlock(3, 'a3', 2, 'different-from-a2'),
            ],
        }

        removeOverlaps(batch)

        expect(batch.blocks.map((b) => b.slot)).toEqual([3])
    })

    it('is a no-op on an empty batch', () => {
        const batch: IngestBatch = {blocks: []}
        removeOverlaps(batch)
        expect(batch.blocks).toEqual([])
    })
})

describe('limitUpperBoundary', () => {
    it('passes through batches entirely below `to`', async () => {
        const batches: IngestBatch[] = [
            {blocks: [mkBlock(1, 'h1', 0, 'h0'), mkBlock(2, 'h2', 1, 'h1')]},
            {blocks: [mkBlock(3, 'h3', 2, 'h2')]},
        ]

        const out = await drain(limitUpperBoundary(10, yieldBatches(...batches)))

        expect(out).toHaveLength(2)
        expect(out.flatMap((b) => b.blocks.map((x) => x.slot))).toEqual([1, 2, 3])
    })

    it('trims the last batch at `to` and stops iteration', async () => {
        const batches: IngestBatch[] = [
            {blocks: [mkBlock(1, 'h1', 0, 'h0'), mkBlock(2, 'h2', 1, 'h1')]},
            {blocks: [mkBlock(3, 'h3', 2, 'h2'), mkBlock(4, 'h4', 3, 'h3'), mkBlock(5, 'h5', 4, 'h4')]},
            // upstream would yield more, but limitUpperBoundary must stop
            // after the batch that reached `to`.
            {blocks: [mkBlock(6, 'h6', 5, 'h5')]},
        ]

        const out = await drain(limitUpperBoundary(4, yieldBatches(...batches)))

        expect(out).toHaveLength(2)
        expect(out[0].blocks.map((b) => b.slot)).toEqual([1, 2])
        expect(out[1].blocks.map((b) => b.slot)).toEqual([3, 4]) // trimmed at `to`
    })

    it('does not yield an empty batch when `to` lands below every block in the batch', async () => {
        // The `if (batch.blocks.length > 0) yield batch` guard after the
        // filter prevents an empty shell from leaking downstream.
        const batches: IngestBatch[] = [{blocks: [mkBlock(10, 'h10', 9, 'h9'), mkBlock(11, 'h11', 10, 'h10')]}]

        const out = await drain(limitUpperBoundary(5, yieldBatches(...batches)))

        expect(out).toHaveLength(0)
    })

    // FIXME: TEST NEEDS TO BE FIXED — documents a crash on upstream edge input.
    //
    // What's wrong: `limitUpperBoundary` starts its per-batch check with
    //     if (last(batch.blocks).slot >= to) { ... }
    // and `last()` from `@subsquid/util-internal` asserts `array.length > 0`.
    // An upstream batch that happens to arrive empty (skipped-slot windows
    // from certain fetcher configurations, a filter chain above
    // limitUpperBoundary that could produce an empty IngestBatch, a faulty
    // RPC response) will crash the consumer with a generic AssertionError,
    // not "here's an empty batch, nothing to do".
    //
    // Fix direction: guard the call — e.g.
    //     if (batch.blocks.length === 0) { yield batch; continue }
    // or drop the batch silently. Either is safer than throwing.
    //
    // Wrapped in `it.fails` until the guard lands; vitest reports an
    // unexpected pass the day it's fixed.
    it.fails('passes through an empty upstream batch instead of crashing', async () => {
        const batches: IngestBatch[] = [{blocks: []}]

        const out = await drain(limitUpperBoundary(10, yieldBatches(...batches)))

        expect(out).toEqual([{blocks: []}]) // desired: yield the empty batch through
    })
})

describe('ChainFixer.fillGap', () => {
    // ingest options only need to be well-formed — the depth-cutoff test
    // fires before fillGap ever touches RPC. For richer tests of the
    // recursion, see the it.todo at the bottom.
    const stubIngest: IngestOptions = {
        rpc: {} as IngestOptions['rpc'],
        commitment: 'finalized',
        req: {},
        range: {from: 0},
        strideSize: 5,
        strideConcurrency: 1,
        validateChainContinuity: false,
        maxConfirmationAttempts: 3,
    }

    it('throws "the data source is too unstable" at depth > 3', async () => {
        // The guard at the top of fillGap protects against a runaway
        // recursion when every gap-fill itself opens another gap. The
        // fourth call (depth=4) must throw before doing any fetching.
        const fixer = new ChainFixer(stubIngest, 1)
        const batch: IngestBatch = {blocks: [mkBlock(10, 'h10', 5, 'h5')]}

        // fillGap is private; direct cast is the simplest way to test it
        // in isolation without rebuilding the whole fix() surface.
        const fillGap = (
            fixer as unknown as {
                fillGap: (b: IngestBatch, depth: number) => AsyncIterable<IngestBatch>
            }
        ).fillGap.bind(fixer)

        await expect(
            (async () => {
                for await (const _b of fillGap(batch, 4)) {
                    // drain
                }
            })(),
        ).rejects.toThrow(/too unstable/)
    })

    it('does not enter fillGap when the batch chains cleanly off the current head', async () => {
        // Positive-coverage sanity: a batch whose first block's parentSlot
        // is below `this.from` takes the straight acceptBatch path;
        // ChainFixer.fix never calls fillGap. Verifies the shape of the
        // "no gap" success path we rely on for the depth-cutoff interpretation
        // to be meaningful.
        const fixer = new ChainFixer(stubIngest, 5)

        // Single block whose parent is 4 (< from=5) → acceptBatch accepts
        // it as head, no tail.
        const upstream: IngestBatch[] = [{blocks: [mkBlock(5, 'h5', 4, 'h4'), mkBlock(6, 'h6', 5, 'h5')]}]

        const out = await drain(fixer.fix(yieldBatches(...upstream)))

        expect(out).toHaveLength(1)
        expect(out[0].blocks.map((b) => b.slot)).toEqual([5, 6])
    })

    // Full gap-filling recursion with controlled parentSlot trees requires
    // mocking ./fetch's getBlocks() to return tailored responses per gap
    // range. That's ~40 lines of fixture harness and a vi.mock module
    // override just to exercise depth=2 and depth=3 happy paths. Left as
    // an explicit todo because:
    //   - The depth-cutoff guard above is the load-bearing safety net.
    //   - Downstream integration tests already exercise ChainFixer.fix()
    //     through the Solana processor fixtures.
    //   - Writing the mock right requires replicating getBlocks' stride-
    //     aware batching, which is its own can of worms.
    it.todo('fillGap recursion fills a 2-level nested gap (depth=1 → depth=2) via fetched sub-batches')
    it.todo('fillGap at depth=3 succeeds when the gap closes (boundary case — depth=3 is allowed)')
})
