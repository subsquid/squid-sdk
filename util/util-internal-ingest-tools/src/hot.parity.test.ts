// Parity test against `__legacy/hot-master.ts` (frozen snapshot of
// hot.ts from master). For scenarios that lie OUTSIDE the four bugs we
// fixed in this branch, the new HotProcessor must emit exactly the same
// HotUpdates as the old one — same blocks, same baseHead, same
// finalizedHead, same getHeight()/getFinalizedHeight() at the end.
//
// For scenarios INSIDE the bug categories, divergence is expected and
// documented; those cases are exercised in hot.test.ts directly.
import {buildChain, createMockDataSource, forkAt, joinFork, type MockBlock} from '@subsquid/util-internal-testing'
import {describe, expect, it} from 'vitest'
import {LegacyHotProcessor} from './__legacy/hot-master'
import {HotProcessor} from './hot'
import type {HashAndHeight, HotState, HotUpdate} from './interfaces'
import type {BlockRef} from './ref'

const GENESIS: HotState = {height: 0, hash: '0x0', top: []}

interface PairOptions {
    chain: MockBlock[]
    state?: HotState
    batchSize?: number
}

interface Pair {
    legacy: {
        processor: LegacyHotProcessor<MockBlock>
        source: ReturnType<typeof createMockDataSource<MockBlock>>
        updates: HotUpdate<MockBlock>[]
    }
    next: {
        processor: HotProcessor<MockBlock>
        source: ReturnType<typeof createMockDataSource<MockBlock>>
        updates: HotUpdate<MockBlock>[]
    }
}

function makePair(opts: PairOptions): Pair {
    const state = opts.state ?? GENESIS
    const legacySource = createMockDataSource<MockBlock>(opts.chain, {batchSize: opts.batchSize})
    const nextSource = createMockDataSource<MockBlock>(opts.chain, {batchSize: opts.batchSize})
    const legacyUpdates: HotUpdate<MockBlock>[] = []
    const nextUpdates: HotUpdate<MockBlock>[] = []
    const legacy = new LegacyHotProcessor<MockBlock>(state, {
        process: async (u) => {
            legacyUpdates.push(u)
        },
        getBlock: legacySource.getBlock,
        getBlockRange: legacySource.getBlockRange,
        getHeader: legacySource.getHeader,
        getFinalizedBlockHeight: legacySource.getFinalizedBlockHeight,
    })
    const next = new HotProcessor<MockBlock>(state, {
        process: async (u) => {
            nextUpdates.push(u)
        },
        getBlock: nextSource.getBlock,
        getBlockRange: nextSource.getBlockRange,
        getHeader: nextSource.getHeader,
        getFinalizedBlockHeight: nextSource.getFinalizedBlockHeight,
    })
    return {
        legacy: {processor: legacy, source: legacySource, updates: legacyUpdates},
        next: {processor: next, source: nextSource, updates: nextUpdates},
    }
}

function refOf(b: HashAndHeight): {height: number; hash: string} {
    return {height: b.height, hash: b.hash}
}

function expectEmissionsEqual(legacy: HotUpdate<MockBlock>[], next: HotUpdate<MockBlock>[]): void {
    expect(next).toHaveLength(legacy.length)
    for (let i = 0; i < legacy.length; i++) {
        const l = legacy[i]
        const n = next[i]
        expect(n.blocks.map((b) => b.hash)).toEqual(l.blocks.map((b) => b.hash))
        expect(refOf(n.baseHead)).toEqual(refOf(l.baseHead))
        expect(refOf(n.finalizedHead)).toEqual(refOf(l.finalizedHead))
    }
}

describe('HotProcessor parity vs master snapshot', () => {
    it('linear progress (single batch) — identical emissions', async () => {
        const main = buildChain({from: 1, to: 5})
        const {legacy, next} = makePair({chain: main})
        const heads = {best: main[4], finalized: main[0]}
        await legacy.processor.goto(heads)
        await next.processor.goto(heads)
        expectEmissionsEqual(legacy.updates, next.updates)
        expect(next.processor.getHeight()).toBe(legacy.processor.getHeight())
        expect(next.processor.getFinalizedHeight()).toBe(legacy.processor.getFinalizedHeight())
    })

    it('linear progress (multi-batch via batchSize=2) — identical emissions', async () => {
        const main = buildChain({from: 1, to: 7})
        const {legacy, next} = makePair({chain: main, batchSize: 2})
        const heads = {best: main[6], finalized: main[1]}
        await legacy.processor.goto(heads)
        await next.processor.goto(heads)
        expectEmissionsEqual(legacy.updates, next.updates)
        expect(next.processor.getHeight()).toBe(legacy.processor.getHeight())
        expect(next.processor.getFinalizedHeight()).toBe(legacy.processor.getFinalizedHeight())
    })

    it('shallow reorg (3-block divergent suffix) — identical emissions', async () => {
        const main = buildChain({from: 1, to: 5})
        const branch = forkAt(main, {at: 3, length: 3, suffix: 'a'})
        const postReorg = joinFork(main, branch)
        const {legacy, next} = makePair({chain: main})

        await legacy.processor.goto({best: main[4], finalized: main[0]})
        await next.processor.goto({best: main[4], finalized: main[0]})

        legacy.source.setChain(postReorg)
        next.source.setChain(postReorg)

        await legacy.processor.goto({best: {height: 6, hash: '0x6a'}, finalized: main[0]})
        await next.processor.goto({best: {height: 6, hash: '0x6a'}, finalized: main[0]})

        expectEmissionsEqual(legacy.updates, next.updates)
        expect(next.processor.getHeight()).toBe(legacy.processor.getHeight())
        expect(next.processor.getFinalizedHeight()).toBe(legacy.processor.getFinalizedHeight())
    })

    it('pinned finalized (no active finalization) — identical emissions across multiple gotos', async () => {
        const main = buildChain({from: 1, to: 10})
        const {legacy, next} = makePair({chain: main})
        const pinned = {height: 0, hash: '0x0'}

        await legacy.processor.goto({best: main[4], finalized: pinned})
        await next.processor.goto({best: main[4], finalized: pinned})

        await legacy.processor.goto({best: main[9], finalized: pinned})
        await next.processor.goto({best: main[9], finalized: pinned})

        expectEmissionsEqual(legacy.updates, next.updates)
        expect(next.processor.getHeight()).toBe(legacy.processor.getHeight())
        expect(next.processor.getFinalizedHeight()).toBe(legacy.processor.getFinalizedHeight())
    })

    it('idempotent re-goto with identical heads — identical (no extra emission)', async () => {
        const main = buildChain({from: 1, to: 3})
        const {legacy, next} = makePair({chain: main})

        await legacy.processor.goto({best: main[2], finalized: main[0]})
        await next.processor.goto({best: main[2], finalized: main[0]})

        await legacy.processor.goto({best: main[2], finalized: main[0]})
        await next.processor.goto({best: main[2], finalized: main[0]})

        expectEmissionsEqual(legacy.updates, next.updates)
    })

    it('1000 hot blocks in one goto — identical emissions', async () => {
        const main = buildChain({from: 1, to: 1000})
        const {legacy, next} = makePair({chain: main})
        const heads = {best: main[999], finalized: main[0]}
        await legacy.processor.goto(heads)
        await next.processor.goto(heads)
        expectEmissionsEqual(legacy.updates, next.updates)
        expect(next.processor.getHeight()).toBe(legacy.processor.getHeight())
        expect(next.processor.getFinalizedHeight()).toBe(legacy.processor.getFinalizedHeight())
    })

    it('400-block deep reorg — identical emissions', async () => {
        const main = buildChain({from: 1, to: 500})
        const branch = forkAt(main, {at: 100, length: 400, suffix: 'a'})
        const postReorg = joinFork(main, branch)
        const {legacy, next} = makePair({chain: main})

        await legacy.processor.goto({best: main[499], finalized: main[0]})
        await next.processor.goto({best: main[499], finalized: main[0]})

        legacy.source.setChain(postReorg)
        next.source.setChain(postReorg)

        await legacy.processor.goto({best: {height: 500, hash: '0x500a'}, finalized: main[0]})
        await next.processor.goto({best: {height: 500, hash: '0x500a'}, finalized: main[0]})

        expectEmissionsEqual(legacy.updates, next.updates)
        expect(next.processor.getHeight()).toBe(legacy.processor.getHeight())
        expect(next.processor.getFinalizedHeight()).toBe(legacy.processor.getFinalizedHeight())
    })
})

describe('HotProcessor — documented divergences from master', () => {
    // These are the four bugs we fixed. Legacy and Next intentionally
    // diverge here; the parity test documents how.

    it('finality-only update (same best, newer finalized) — Next emits, Legacy does not', async () => {
        const main = buildChain({from: 1, to: 5})
        const {legacy, next} = makePair({chain: main})

        await legacy.processor.goto({best: main[4], finalized: main[0]})
        await next.processor.goto({best: main[4], finalized: main[0]})

        await legacy.processor.goto({best: main[4], finalized: main[2]})
        await next.processor.goto({best: main[4], finalized: main[2]})

        // Legacy: drops the second goto entirely. finalized stays at 1.
        expect(legacy.updates).toHaveLength(1)
        expect(legacy.processor.getFinalizedHeight()).toBe(1)

        // Next: emits a no-block update so DB writers learn of the advance.
        expect(next.updates).toHaveLength(2)
        expect(next.updates[1].blocks).toEqual([])
        expect(next.processor.getFinalizedHeight()).toBe(3)
    })

    it('finalized > best (RPC lying) — Next throws, Legacy silently clamps', async () => {
        const main = buildChain({from: 1, to: 5})
        const {legacy, next} = makePair({chain: main})

        // Legacy: clamps pos to chain.length-1, accepts the lie. No throw.
        await legacy.processor.goto({best: main[4], finalized: {height: 10, hash: '0xunverifiable'}})
        // Legacy commits a finalizedHeight that was never verified.
        expect(legacy.processor.getFinalizedHeight()).toBe(10)

        // Next: throws DataConsistencyError up front (finalized > best).
        let caught: unknown
        try {
            await next.processor.goto({best: main[4], finalized: {height: 10, hash: '0xunverifiable'}})
        } catch (e) {
            caught = e
        }
        expect(caught).toBeDefined()
    })

    it('finalized at genesis by hash only (height=0) — Next does not invoke fetcher, Legacy does', async () => {
        const main = buildChain({from: 1, to: 3})
        const legacySource = createMockDataSource<MockBlock>(main)
        const nextSource = createMockDataSource<MockBlock>(main)
        legacySource.addBlocks([{height: 0, hash: '0x0', parentHash: '0x0'}])
        nextSource.addBlocks([{height: 0, hash: '0x0', parentHash: '0x0'}])

        let legacyFetcherCalls = 0
        let nextFetcherCalls = 0
        const legacy = new LegacyHotProcessor<MockBlock>(GENESIS, {
            process: async () => {},
            getBlock: legacySource.getBlock,
            getBlockRange: legacySource.getBlockRange,
            getHeader: legacySource.getHeader,
            getFinalizedBlockHeight: async (hash) => {
                legacyFetcherCalls++
                return legacySource.getFinalizedBlockHeight(hash)
            },
        })
        const next = new HotProcessor<MockBlock>(GENESIS, {
            process: async () => {},
            getBlock: nextSource.getBlock,
            getBlockRange: nextSource.getBlockRange,
            getHeader: nextSource.getHeader,
            getFinalizedBlockHeight: async (hash) => {
                nextFetcherCalls++
                return nextSource.getFinalizedBlockHeight(hash)
            },
        })

        const heads = {best: main[main.length - 1], finalized: {hash: '0x0'} as BlockRef}
        await legacy.goto(heads)
        await next.goto(heads)

        // Legacy: `||` treats height 0 as falsy, calls the fetcher anyway.
        expect(legacyFetcherCalls).toBe(1)
        // Next: `??` short-circuits on the in-chain hit at height 0.
        expect(nextFetcherCalls).toBe(0)
    })
})
