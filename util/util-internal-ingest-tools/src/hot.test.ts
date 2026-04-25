import {buildChain, createMockDataSource, forkAt, joinFork, type MockBlock} from '@subsquid/util-internal-testing'
import {describe, expect, it} from 'vitest'
import {HotProcessor} from './hot'
import type {HotState, HotUpdate} from './interfaces'

const GENESIS: HotState = {
    height: 0,
    hash: '0x0',
    top: [],
}

function makeProcessor(
    chain: MockBlock[],
    state: HotState = GENESIS,
): {
    processor: HotProcessor<MockBlock>
    source: ReturnType<typeof createMockDataSource<MockBlock>>
    updates: HotUpdate<MockBlock>[]
} {
    const source = createMockDataSource<MockBlock>(chain)
    const updates: HotUpdate<MockBlock>[] = []
    const processor = new HotProcessor<MockBlock>(state, {
        process: async (u) => {
            updates.push(u)
        },
        getBlock: source.getBlock,
        getBlockRange: source.getBlockRange,
        getHeader: source.getHeader,
        getFinalizedBlockHeight: source.getFinalizedBlockHeight,
    })
    return {processor, source, updates}
}

describe('HotProcessor', () => {
    describe('hot blocks accumulate', () => {
        it('linear progress: emits one update covering from state.height+1 to best, with all blocks', async () => {
            const main = buildChain({from: 1, to: 5})
            const {processor, updates} = makeProcessor(main)

            await processor.goto({
                best: main[main.length - 1], // {height: 5, hash: '0x5'}
                finalized: main[0], // {height: 1, hash: '0x1'}
            })

            expect(updates).toHaveLength(1)
            const update = updates[0]
            expect(update.blocks.map((b) => b.hash)).toEqual(['0x1', '0x2', '0x3', '0x4', '0x5'])
            // baseHead is the parent of the first new block — genesis here.
            expect(update.baseHead).toMatchObject({height: 0, hash: '0x0'})
            // finalizedHead inside the update is what `finalize()` settled on, namely block 1.
            // Note: runtime `finalizedHead` carries MockBlock's `parentHash` too, because
            // HotProcessor stores whatever `getHeader` returns; the typed interface only
            // guarantees {height, hash}. Assert on those two fields only.
            expect(update.finalizedHead).toMatchObject({height: 1, hash: '0x1'})

            expect(processor.getHeight()).toBe(5)
            expect(processor.getFinalizedHeight()).toBe(1)
        })

        it('hot blocks accumulate above the finalized head (K = 4)', async () => {
            const main = buildChain({from: 1, to: 5})
            const {processor, updates} = makeProcessor(main)

            await processor.goto({
                best: main[4],
                finalized: main[0], // 4 hot blocks: 2,3,4,5
            })

            // Total blocks processed = 5; finalized = 1; K = 4 hot blocks above finalized.
            expect(updates[0].blocks).toHaveLength(5)
            expect(processor.getHeight()).toBe(5)
            expect(processor.getFinalizedHeight()).toBe(1)
        })

        it('a second goto with no new best is a no-op (isKnownBlock short-circuit)', async () => {
            const main = buildChain({from: 1, to: 3})
            const {processor, updates} = makeProcessor(main)

            await processor.goto({best: main[2], finalized: main[0]})
            expect(updates).toHaveLength(1)

            await processor.goto({best: main[2], finalized: main[0]})
            expect(updates).toHaveLength(1)
        })
    })

    describe('shallow reorg (2–3 blocks)', () => {
        it('replaces the divergent suffix, emitting baseHead at the common ancestor', async () => {
            const main = buildChain({from: 1, to: 5})
            const branch = forkAt(main, {at: 3, length: 3, suffix: 'a'}) // 4a, 5a, 6a
            const postReorg = joinFork(main, branch) // 1,2,3,4a,5a,6a

            const {processor, source, updates} = makeProcessor(main)

            // 1. Accept the initial chain up to block 5.
            await processor.goto({best: main[4], finalized: main[0]})
            expect(updates).toHaveLength(1)
            expect(processor.getHeight()).toBe(5)

            // 2. "Network" switches to the forked chain.
            source.setChain(postReorg)

            // 3. Processor asked to advance to the new best (6a). This backtracks
            //    through 0x5 → 0x4 (previous chain) to the common ancestor 0x3,
            //    then walks forward over the new branch.
            await processor.goto({
                best: {height: 6, hash: '0x6a'},
                finalized: main[0],
            })

            expect(updates).toHaveLength(2)
            const reorg = updates[1]
            expect(reorg.baseHead).toMatchObject({height: 3, hash: '0x3'})
            expect(reorg.blocks.map((b) => b.hash)).toEqual(['0x4a', '0x5a', '0x6a'])
            expect(reorg.finalizedHead).toMatchObject({height: 1, hash: '0x1'})

            expect(processor.getHeight()).toBe(6)
            // The processor's internal chain now lives on the new branch.
            // (Indirectly assert: a redundant goto to the same best is a no-op.)
            await processor.goto({best: {height: 6, hash: '0x6a'}, finalized: main[0]})
            expect(updates).toHaveLength(2)
        })

        it('1-block reorg: only the tip is replaced', async () => {
            const main = buildChain({from: 1, to: 5})
            const branch = forkAt(main, {at: 4, length: 1, suffix: 'a'}) // 5a

            const {processor, source, updates} = makeProcessor(main)
            await processor.goto({best: main[4], finalized: main[0]})

            source.setChain(joinFork(main, branch))
            await processor.goto({best: {height: 5, hash: '0x5a'}, finalized: main[0]})

            const reorg = updates[1]
            expect(reorg.baseHead).toMatchObject({height: 4, hash: '0x4'})
            expect(reorg.blocks.map((b) => b.hash)).toEqual(['0x5a'])
        })
    })

    describe('deep reorg inside top[]', () => {
        it('replaces a 9-block suffix, baseHead at the common ancestor', async () => {
            // Main: 1..12 (finalized at 1, 11 hot blocks).
            // Fork at 3: new branch 4a..12a (9 blocks).
            const main = buildChain({from: 1, to: 12})
            const branch = forkAt(main, {at: 3, length: 9, suffix: 'a'})
            const postReorg = joinFork(main, branch) // 1,2,3,4a..12a

            const {processor, source, updates} = makeProcessor(main)
            await processor.goto({best: main[main.length - 1], finalized: main[0]})
            expect(processor.getHeight()).toBe(12)

            source.setChain(postReorg)
            await processor.goto({
                best: {height: 12, hash: '0x12a'},
                finalized: main[0],
            })

            const reorg = updates[1]
            expect(reorg.baseHead).toMatchObject({height: 3, hash: '0x3'})
            expect(reorg.blocks).toHaveLength(9)
            expect(reorg.blocks.map((b) => b.hash)).toEqual([
                '0x4a',
                '0x5a',
                '0x6a',
                '0x7a',
                '0x8a',
                '0x9a',
                '0x10a',
                '0x11a',
                '0x12a',
            ])

            expect(processor.getHeight()).toBe(12)
        })
    })

    describe('cascading reorgs', () => {
        it('two forks in succession: each emits a correct baseHead', async () => {
            // main:    1 — 2 — 3 — 4 — 5
            // reorg 1: 1 — 2 — 3 — 4 — 5a — 6a        (fork at 4)
            // reorg 2: 1 — 2 — 3b — 4b — 5b — 6b — 7b (fork at 2, deeper)
            const main = buildChain({from: 1, to: 5})
            const branchA = forkAt(main, {at: 4, length: 2, suffix: 'a'}) // 5a, 6a
            const afterA = joinFork(main, branchA) // 1,2,3,4,5a,6a
            const branchB = forkAt(afterA, {at: 2, length: 5, suffix: 'b'}) // 3b..7b
            const afterB = joinFork(afterA, branchB) // 1,2,3b..7b

            const {processor, source, updates} = makeProcessor(main)

            // Initial: accept the main chain.
            await processor.goto({best: main[4], finalized: main[0]})
            expect(updates).toHaveLength(1)

            // Reorg #1: switch to branch A, advance to 6a.
            source.setChain(afterA)
            await processor.goto({
                best: {height: 6, hash: '0x6a'},
                finalized: main[0],
            })
            expect(updates).toHaveLength(2)
            expect(updates[1].baseHead).toMatchObject({height: 4, hash: '0x4'})
            expect(updates[1].blocks.map((b) => b.hash)).toEqual(['0x5a', '0x6a'])

            // Reorg #2: deeper fork — switch to branch B, advance to 7b.
            source.setChain(afterB)
            await processor.goto({
                best: {height: 7, hash: '0x7b'},
                finalized: main[0],
            })
            expect(updates).toHaveLength(3)
            expect(updates[2].baseHead).toMatchObject({height: 2, hash: '0x2'})
            expect(updates[2].blocks.map((b) => b.hash)).toEqual(['0x3b', '0x4b', '0x5b', '0x6b', '0x7b'])

            expect(processor.getHeight()).toBe(7)
        })
    })

    describe('finality-only update', () => {
        // FIXME: TEST NEEDS TO BE FIXED — the production code it targets is buggy.
        //
        // What's wrong: HotProcessor.goto() in hot.ts returns early when
        // `isKnownBlock(heads.best)` is true, BEFORE the line
        // `this.finalizedHead = heads.finalized` runs. As a result, a stream
        // that advances ONLY finality (same `best`, newer `finalized`) is
        // silently dropped until the next new tip arrives. Finality can trail
        // reality indefinitely, which blocks downstream consumers (database
        // writers, rollback logic) from ever learning that more blocks became
        // safe to commit.
        //
        // The fix in hot.ts is to update `this.finalizedHead` (and invoke
        // `finalize()` on the current chain) BEFORE the `isKnownBlock` short-
        // circuit, so finality always takes effect even without a new tip.
        //
        // Wrapped in `it.fails` so the suite stays green today. Once hot.ts
        // is fixed, vitest will report this as an unexpected pass — that is
        // the signal to:
        //   1. Remove this FIXME block,
        //   2. Replace `it.fails(...)` with a regular `it(...)`.
        it.fails('advances the finalized head when best is unchanged', async () => {
            const main = buildChain({from: 1, to: 5})
            const {processor} = makeProcessor(main)

            await processor.goto({best: main[4], finalized: main[0]})
            expect(processor.getFinalizedHeight()).toBe(1)

            // Same best, but finality has moved forward to block 3.
            await processor.goto({
                best: main[4],
                finalized: main[2],
            })

            // Expected: finalized head advances.
            // Actual: still 1 because goto() short-circuits on isKnownBlock(best).
            expect(processor.getFinalizedHeight()).toBe(3)
        })
    })

    describe('finalize() edge cases', () => {
        // FIXME: TEST NEEDS TO BE FIXED — the production code it targets is buggy.
        //
        // What's wrong: HotProcessor.finalize() in hot.ts silently accepts a
        // finalizedHead whose height is beyond the known chain tip. The code
        // clamps `pos = Math.min(pos, chain.length - 1)` and only runs the
        // `chain[pos].hash === finalizedHead.hash` assertion when `pos` falls
        // within the chain — so a finalizedHead that claims height 10 while
        // the tip is only at 5 passes through unchecked. The processor then
        // reports getFinalizedHeight() = 10 even though nothing past height 5
        // has been verified.
        //
        // Downstream consequence: database writers may permanently commit
        // blocks as finalized based on an unverifiable claim from the data
        // source (e.g. a malicious or broken RPC), with no rollback path.
        //
        // The fix in hot.ts is to either (a) refuse finalization beyond the
        // known tip (throw), or (b) defer it until enough blocks have been
        // fetched to cover the claimed height — never clamp silently.
        //
        // Wrapped in `it.fails` so the suite stays green today. When hot.ts
        // is fixed, vitest reports an unexpected pass — the signal to remove
        // this FIXME block and replace `it.fails(...)` with a regular `it(...)`.
        it.fails('rejects finalizedHead ahead of the known chain tip', async () => {
            const main = buildChain({from: 1, to: 5})
            const {processor} = makeProcessor(main)

            // finalizedHead points to height 10 — five blocks past our tip.
            // Hash is unknown; cannot possibly be verified.
            await expect(
                processor.goto({
                    best: main[4],
                    finalized: {height: 10, hash: '0xunverifiable'},
                }),
            ).rejects.toThrow()
        })

        // FIXME: TEST NEEDS TO BE FIXED — the production code it targets is buggy.
        //
        // What's wrong: HotProcessor.finalize() computes the finalized height
        // from a hash-only BlockRef with
        //     finalizedHeight = chain.find(b => b.hash == ...)?.height
        //         || await this.getFinalizedBlockHeight(...)
        // The `||` treats the integer 0 as falsy. When the finalized block IS
        // the genesis (height 0) and IS already in the local chain, `?.height`
        // correctly returns 0, but `|| await fetch(...)` discards it and calls
        // the fetcher anyway — wasting work at best, and crashing if the
        // fetcher cannot be reached (e.g. offline, or genesis not indexed by
        // whatever backend serves getFinalizedBlockHeight).
        //
        // The fix in hot.ts is to change `||` to `??`, which coalesces only
        // on null/undefined, so a legitimate height of 0 short-circuits the
        // fetcher as intended.
        //
        // Wrapped in `it.fails`. Once hot.ts is fixed, this test will start
        // passing — that is the signal to remove this FIXME block and
        // replace `it.fails(...)` with a regular `it(...)`.
        it.fails('accepts finalized hash at genesis (height=0) without invoking the fetcher', async () => {
            const main = buildChain({from: 1, to: 3})
            const source = createMockDataSource<MockBlock>(main)
            // Pre-register the genesis block in the pool so that IF the
            // fetcher is (wrongly) called it can return a value — that way
            // this test isolates the `|| vs ??` bug from the "fetcher not
            // available" failure mode.
            source.addBlocks([{height: 0, hash: '0x0', parentHash: '0x0'}])

            let fetcherCalls = 0
            const processor = new HotProcessor<MockBlock>(GENESIS, {
                process: async () => {},
                getBlock: source.getBlock,
                getBlockRange: source.getBlockRange,
                getHeader: source.getHeader,
                getFinalizedBlockHeight: async (hash) => {
                    fetcherCalls++
                    return source.getFinalizedBlockHeight(hash)
                },
            })

            await processor.goto({
                best: main[main.length - 1],
                finalized: {hash: '0x0'}, // by hash only — triggers the `||` branch
            })

            // Genesis is at chain[0] with height 0. The fetcher must not be needed.
            expect(fetcherCalls).toBe(0)
            expect(processor.getFinalizedHeight()).toBe(0)
        })

        it('asserts when finalizedHead hash does not match the chain at that height', async () => {
            const main = buildChain({from: 1, to: 5})
            const {processor} = makeProcessor(main)

            // finalizedHead points to height 3, which IS in chain after the
            // first goto — but with a hash that doesn't match the real block 3.
            // HotProcessor.finalize() must detect this via
            //     assert(chain[pos].hash === this.finalizedHead.hash)
            // and throw, rather than accept a lie about finality.
            await expect(
                processor.goto({
                    best: main[4],
                    finalized: {height: 3, hash: '0xwrong'},
                }),
            ).rejects.toThrow()
        })
    })

    describe('long top[]', () => {
        // Guards against a performance regression to O(N²) or worse in the
        // moveToBlocks path, which is the kind of thing that only shows up on
        // chains with many unfinalized blocks (long confirmation depth). A
        // 5-second ceiling is very generous — these tests exist to flag a
        // collapse to quadratic time, not to profile the fast path.

        it('absorbs 1000 hot blocks in a single goto', async () => {
            const main = buildChain({from: 1, to: 1000})
            const {processor, updates} = makeProcessor(main)

            const start = Date.now()
            await processor.goto({best: main[999], finalized: main[0]})
            const elapsed = Date.now() - start

            expect(updates).toHaveLength(1)
            expect(updates[0].blocks).toHaveLength(1000)
            expect(processor.getHeight()).toBe(1000)
            expect(elapsed).toBeLessThan(5000)
        })

        it('rolls back 400 hot blocks during a deep reorg', async () => {
            // Main: 1..500; fork at height 100 with a 400-block alternative branch.
            // The reorg path in moveToBlocks has to backtrack 400 times via
            // getBlock before it finds the common ancestor at height 100.
            const main = buildChain({from: 1, to: 500})
            const branch = forkAt(main, {at: 100, length: 400, suffix: 'a'})
            const postReorg = joinFork(main, branch)

            const {processor, source, updates} = makeProcessor(main)
            await processor.goto({best: main[499], finalized: main[0]})
            expect(processor.getHeight()).toBe(500)

            source.setChain(postReorg)

            const start = Date.now()
            await processor.goto({
                best: {height: 500, hash: '0x500a'},
                finalized: main[0],
            })
            const elapsed = Date.now() - start

            expect(updates).toHaveLength(2)
            expect(updates[1].baseHead).toMatchObject({height: 100, hash: '0x100'})
            expect(updates[1].blocks).toHaveLength(400)
            expect(updates[1].blocks[0].hash).toBe('0x101a')
            expect(updates[1].blocks[399].hash).toBe('0x500a')
            expect(elapsed).toBeLessThan(5000)
        })
    })

    describe('no active finalization', () => {
        it('hot blocks accumulate without advancing finality when finalized stays pinned to the initial state', async () => {
            const main = buildChain({from: 1, to: 10})
            const {processor, updates} = makeProcessor(main)

            // Two successive goto calls with identical `finalized` — the
            // real-world shape of a data source that never reports finality
            // (e.g. a Portal response with no X-Sqd-Finalized-Head-* header
            // and the processor passing a stub finalized ref to HotProcessor).
            const pinnedFinalized = {height: 0, hash: '0x0'}
            await processor.goto({best: main[4], finalized: pinnedFinalized})
            await processor.goto({best: main[9], finalized: pinnedFinalized})

            expect(updates).toHaveLength(2)

            // Tip advances, finality doesn't — all ten blocks now hot.
            expect(processor.getHeight()).toBe(10)
            expect(processor.getFinalizedHeight()).toBe(0)

            // Every emitted HotUpdate carries the same (pinned) finalized head.
            for (const u of updates) {
                expect(u.finalizedHead).toMatchObject({height: 0, hash: '0x0'})
            }
        })
    })

    describe('divergence below chain[0]', () => {
        // FIXME: TEST NEEDS TO BE FIXED — documents an edge case in
        // moveToBlocks where the error surface is present but uninformative.
        //
        // Scenario: an inconsistent data source keeps returning coherent-
        // looking parents on backtrack, so the inner while loop in
        // moveToBlocks
        //     while (last(chain).hash !== head.hash) {
        //         ...
        //         chain.pop()
        //     }
        // pops its local slice past index 0. On the next iteration,
        // `last(chain)` runs against an empty array.
        //
        // Today `last()` from @subsquid/util-internal guards its own
        // precondition — `assert(array.length > 0)` — and throws a generic
        // AssertionError whose message is just the expression text
        // ("(array.length > 0)"). That's good enough to avoid a hang or a
        // raw TypeError, but operators see a cryptic stack trace with no
        // indication that the real cause is "the fork diverged below what
        // we could locally resolve from state". There is no way to tell
        // that condition apart from any other empty-array assertion.
        //
        // Fix direction in hot.ts: add a guard to the second while loop
        // that checks `chain.length === 0` explicitly and throws a typed
        // "common ancestor below known state" error with the observed
        // `head` included in the message. This preserves the existing
        // safety (we never access undefined.hash) while giving operators
        // a domain-level signal.
        //
        // The test asserts the error message contains one of several
        // domain-specific tokens. Wrapped in `it.fails` because today the
        // message is just the raw expression; when the typed error lands,
        // vitest reports an unexpected pass — the signal to remove this
        // FIXME and replace `it.fails(...)` with a regular `it(...)`.
        it.fails('throws a domain-specific error when the fork sinks below chain[0]', async () => {
            // State already "finalized" up to height 5 on the main chain.
            const state: HotState = {height: 5, hash: '0x5', top: []}

            // The data source has been handed an alternate view where every
            // block on the way down diverges from the main chain — 0x5alt,
            // 0x4alt, 0x3alt — so the backtrack walk never meets 0x5 and
            // keeps popping the local chain past index 0.
            const altBlocks: MockBlock[] = [
                {height: 3, hash: '0x3alt', parentHash: '0x2alt'},
                {height: 4, hash: '0x4alt', parentHash: '0x3alt'},
                {height: 5, hash: '0x5alt', parentHash: '0x4alt'},
                {height: 6, hash: '0x6alt', parentHash: '0x5alt'},
            ]

            const source = createMockDataSource<MockBlock>()
            source.setChain([altBlocks[altBlocks.length - 1]])
            source.addBlocks(altBlocks)

            const processor = new HotProcessor<MockBlock>(state, {
                process: async () => {},
                getBlock: source.getBlock,
                getBlockRange: source.getBlockRange,
                getHeader: source.getHeader,
                getFinalizedBlockHeight: source.getFinalizedBlockHeight,
            })

            let caught: Error | undefined
            try {
                await processor.goto({
                    best: {height: 6, hash: '0x6alt'},
                    finalized: {height: 5, hash: '0x5alt'},
                })
            } catch (e) {
                caught = e as Error
            }

            expect(caught).toBeDefined()
            // Current: generic AssertionError with the expression text from
            // `last([])`'s precondition — "(array.length > 0)" — no domain
            // context. Desired: a message that names the situation so operators
            // can understand what happened without reading hot.ts.
            expect(caught?.message ?? '').toMatch(/common ancestor|fork too deep|below known state|diverged below/i)
        })
    })
})
