import {BlockBatch, BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'

import {FallbackDataSource, RankedSource} from './fallback'
import {FallbackPolicy} from './policy'

interface TestBlock {
    header: {number: number; hash: string}
}

function blk(n: number, hash?: string): TestBlock {
    return {header: {number: n, hash: hash ?? `0x${n}`}}
}

function batch(blocks: TestBlock[], finalizedHead?: BlockRef): BlockBatch<TestBlock> {
    return {blocks, finalizedHead}
}

type StreamFn = (req: StreamRequest, call: number) => AsyncGenerator<BlockBatch<TestBlock>>

class MockSource implements DataSource<TestBlock> {
    calls: StreamRequest[] = []

    constructor(
        private onStream: StreamFn,
        private opts: {head?: () => Promise<BlockRef>; blocksCount?: number} = {},
    ) {}

    getStream(req: StreamRequest): BlockStream<TestBlock> {
        let call = this.calls.length
        this.calls.push(req)
        return this.onStream(req, call)
    }
    getFinalizedStream(req: StreamRequest): BlockStream<TestBlock> {
        return this.getStream(req)
    }
    async getHead(): Promise<BlockRef> {
        if (this.opts.head) return this.opts.head()
        throw new Error('head unavailable')
    }
    async getFinalizedHead(): Promise<BlockRef> {
        return this.getHead()
    }
    getBlocksCountInRange(): number {
        return this.opts.blocksCount ?? 0
    }
}

function ranked(source: DataSource<TestBlock>, name: string): RankedSource<TestBlock> {
    return {name, source}
}

function fallback(sources: DataSource<TestBlock>[], policy?: FallbackPolicy) {
    return new FallbackDataSource<TestBlock>({
        sources: sources.map((s, i) => ranked(s, `s${i}`)),
        getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
        policy,
    })
}

async function collect(stream: BlockStream<TestBlock>): Promise<TestBlock[]> {
    let out: TestBlock[] = []
    for await (let b of stream) out.push(...b.blocks)
    return out
}

const numbers = (blocks: TestBlock[]) => blocks.map((b) => b.header.number)

describe('FallbackDataSource — selection', () => {
    it('drives the lowest-index source; standbys are untouched', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1), blk(2)])
            yield batch([blk(3)])
        })
        let s1 = new MockSource(async function* () {
            yield batch([blk(1)])
        })
        let fb = fallback([s0, s1])

        let blocks = await collect(fb.getStream({from: 1, to: 3}))
        expect(numbers(blocks)).toEqual([1, 2, 3])
        expect(s1.calls).toHaveLength(0)
    })

    it('skips a source that fails immediately and uses the next', async () => {
        let s0 = new MockSource(async function* () {
            throw new Error('down')
        })
        let s1 = new MockSource(async function* () {
            yield batch([blk(1), blk(2)])
        })
        let fb = fallback([s0, s1])

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
    })
})

describe('FallbackDataSource — failure-driven switching', () => {
    it('resumes the next source from lastCommitted with no gap or dup', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1), blk(2), blk(3)])
            throw new Error('boom')
        })
        let s1 = new MockSource(async function* (req) {
            // resume must start right after block 3, with its hash as parentHash
            expect(req.from).toBe(4)
            expect(req.parentHash).toBe('0x3')
            yield batch([blk(4), blk(5)])
        })
        let fb = fallback([s0, s1])

        expect(numbers(await collect(fb.getStream({from: 1, to: 5})))).toEqual([1, 2, 3, 4, 5])
        expect(s1.calls).toHaveLength(1)
    })

    it('cascades through multiple failing sources', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)])
            throw new Error('e0')
        })
        let s1 = new MockSource(async function* () {
            throw new Error('e1')
        })
        let s2 = new MockSource(async function* (req) {
            expect(req.from).toBe(2)
            yield batch([blk(2), blk(3)])
        })
        let fb = fallback([s0, s1, s2])

        expect(numbers(await collect(fb.getStream({from: 1, to: 3})))).toEqual([1, 2, 3])
    })
})

describe('FallbackDataSource — fork handling', () => {
    it('propagates ForkException instead of switching', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1), blk(2)])
            throw new ForkException(3, '0x2', [{number: 2, hash: '0x2'}])
        })
        let s1 = new MockSource(async function* () {
            yield batch([blk(99)])
        })
        let fb = fallback([s0, s1])

        let seen: number[] = []
        await expect(
            (async () => {
                for await (let b of fb.getStream({from: 1, to: 10})) seen.push(...numbers(b.blocks))
            })(),
        ).rejects.toBeInstanceOf(ForkException)
        expect(seen).toEqual([1, 2])
        expect(s1.calls).toHaveLength(0) // fork did NOT trigger a switch
    })

    it('propagates a fork that straddles a switch (new source disagrees at resume)', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1), blk(2)])
            throw new Error('non-fork error → switch')
        })
        let s1 = new MockSource(async function* (req) {
            expect(req.from).toBe(3)
            throw new ForkException(3, req.parentHash!, [{number: 2, hash: '0x2'}])
        })
        let fb = fallback([s0, s1])

        await expect(collect(fb.getStream({from: 1, to: 10}))).rejects.toBeInstanceOf(ForkException)
    })
})

describe('FallbackDataSource — finalized pass-through', () => {
    it('forwards finalizedHead unchanged across a switch (no clamp)', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)], {number: 100, hash: '0x100'})
            throw new Error('switch')
        })
        let s1 = new MockSource(async function* () {
            yield batch([blk(2)], {number: 80, hash: '0x80'}) // deeper finality → lower number
        })
        let fb = fallback([s0, s1])

        let heads: (number | undefined)[] = []
        for await (let b of fb.getStream({from: 1, to: 2})) heads.push(b.finalizedHead?.number)
        expect(heads).toEqual([100, 80]) // forwarded as-is; clamping is the target's job
    })
})

describe('FallbackDataSource — all sources down', () => {
    it('throws AllSourcesDown after a finite timeout', async () => {
        let down: StreamFn = async function* () {
            throw new Error('down')
        }
        let fb = fallback([new MockSource(down), new MockSource(down)], {
            allDownTimeoutMs: 0,
            allDownPollMs: 1,
        })

        await expect(collect(fb.getStream({from: 1, to: 5}))).rejects.toThrowError(/all fallback data sources/)
    })
})

describe('FallbackDataSource — switch-up / recovery', () => {
    // S0 fails immediately (→ S1 active), then later recovers; we assert eager reclaim.
    function scenario(preferPrimary: 'eager' | 'onFailureOnly') {
        let now = 0
        let s0 = new MockSource(async function* (req, call) {
            if (call === 0) throw new Error('s0 down')
            expect(req.from).toBe(2) // switch-up resumes from lastCommitted
            yield batch([blk(2)])
            yield batch([blk(3)])
        })
        let s1 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2, '0x2-s1')])
            yield batch([blk(3, '0x3-s1')])
        })
        let fb = new FallbackDataSource<TestBlock>({
            sources: [ranked(s0, 's0'), ranked(s1, 's1')],
            getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
            policy: {preferPrimary, cooldownMs: 1000, clock: () => now},
        })
        return {fb, s0, s1, recover: () => (now = 1000)}
    }

    it('eager: reclaims the recovered higher-preference source at the next batch boundary', async () => {
        let {fb, s0, recover} = scenario('eager')
        let it = fb.getStream({from: 1, to: 3})[Symbol.asyncIterator]()

        let first = await it.next() // [1] from s1 (s0 failed internally)
        expect(numbers(first.value.blocks)).toEqual([1])

        recover()
        fb.health[0].onLivenessPass()
        fb.health[0].onLivenessPass()
        fb.health[0].onLivenessPass()
        expect(fb.health[0].state).toBe('healthy')

        let rest: number[] = []
        for (let n = await it.next(); !n.done; n = await it.next()) rest.push(...numbers(n.value.blocks))
        expect(rest).toEqual([2, 3]) // served by the reclaimed s0
        expect(s0.calls).toHaveLength(2) // initial failure + reclaim
    })

    it('onFailureOnly: does not switch up; the active source keeps serving', async () => {
        let {fb, s0, recover} = scenario('onFailureOnly')
        let it = fb.getStream({from: 1, to: 3})[Symbol.asyncIterator]()

        let first = await it.next()
        expect(numbers(first.value.blocks)).toEqual([1])

        recover()
        fb.health[0].onLivenessPass()
        fb.health[0].onLivenessPass()
        fb.health[0].onLivenessPass()

        let rest: number[] = []
        for (let n = await it.next(); !n.done; n = await it.next()) rest.push(...numbers(n.value.blocks))
        expect(rest).toEqual([2, 3]) // still s1
        expect(s0.calls).toHaveLength(1) // never reclaimed
    })
})

const hang = () => new Promise(() => {})
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('FallbackDataSource — freshness (M1)', () => {
    it('(a) lag: fails over once it falls behind the independent head (after arming at the tip)', async () => {
        let s1heads = [95, 110] // first read arms (lag 5), second trips (lag 19)
        let s0 = new MockSource(async function* () {
            yield batch([blk(90)])
            yield batch([blk(91)])
            yield batch([blk(92)]) // not reached
        })
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(92)
                yield batch([blk(92), blk(93)])
            },
            {head: async () => ({number: s1heads.shift() ?? 110, hash: '0x'})},
        )
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 90, to: 93})))).toEqual([90, 91, 92, 93])
        expect(fb.activeIndex).toBe(1)
    })

    it('(b) historical sync: a huge lag during backfill never fails over (never armed)', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2)])
            yield batch([blk(3)])
        })
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: 1_000_000, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0})

        expect(numbers(await collect(fb.getStream({from: 1, to: 3})))).toEqual([1, 2, 3])
        expect(fb.activeIndex).toBe(0)
    })

    it('(c) staleness: fails over a stalled source when a fresher source is ahead', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)])
            await hang()
        })
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(2)
                yield batch([blk(2)])
            },
            {head: async () => ({number: 100, hash: '0x'})},
        )
        let fb = fallback([s0, s1], {
            maxStalenessMs: 30,
            freshnessTickMs: 5,
            headTtlMs: 0,
            maxLagBlocks: null,
            cooldownMs: 60_000,
        })

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(fb.activeIndex).toBe(1)
    }, 5000)

    it('(d) global stall: no fresher source → holds + flags chainStalled, no churn', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(50)])
            await wait(120)
            throw new Error('client timeout') // eventually errors, like a real client
        })
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(51)
                yield batch([blk(51)])
            },
            {head: async () => ({number: 50, hash: '0x'})}, // same head → global stall
        )
        let fb = fallback([s0, s1], {
            maxStalenessMs: 30,
            freshnessTickMs: 5,
            headTtlMs: 0,
            maxLagBlocks: null,
            churnOnGlobalStall: false,
            cooldownMs: 60_000,
        })

        let it = fb.getStream({from: 50, to: 100})[Symbol.asyncIterator]()
        expect(numbers((await it.next()).value.blocks)).toEqual([50])

        let pending = it.next() // hangs; staleness climbs but no fresher source exists
        await wait(80)
        expect(fb.chainStalled).toBe(true)
        expect(fb.activeIndex).toBe(0) // held — did NOT churn

        // s0 finally errors → ordinary failover to s1
        expect(numbers((await pending).value.blocks)).toEqual([51])
        expect(fb.activeIndex).toBe(1)
    }, 5000)

    it('(e) slow-handler immunity: a slow downstream consumer does not mark the source stale', async () => {
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                yield batch([blk(2)])
                yield batch([blk(3)])
            },
            {head: async () => ({number: 3, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: 100, hash: '0x'})})
        let fb = fallback([s0, s1], {maxStalenessMs: 30, freshnessTickMs: 5, headTtlMs: 0, maxLagBlocks: null})

        let it = fb.getStream({from: 1, to: 3})[Symbol.asyncIterator]()
        let got: number[] = []
        for (let n = await it.next(); !n.done; n = await it.next()) {
            got.push(...numbers(n.value.blocks))
            await wait(50) // slow handler > maxStalenessMs, but parked at yield (clock not running)
        }
        expect(got).toEqual([1, 2, 3]) // never failed over
        expect(fb.activeIndex).toBe(0)
    }, 5000)

    it('(f) thresholds disabled: neither lag nor staleness fires', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2)])
        })
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: 1_000_000, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: null, maxStalenessMs: null, headTtlMs: 0})

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(fb.activeIndex).toBe(0)
    })
})

describe('FallbackDataSource — getHead delegation', () => {
    it('delegates to the active source and fails over on error', async () => {
        let noop: StreamFn = async function* () {}
        let s0 = new MockSource(noop, {
            head: async () => {
                throw new Error('down')
            },
        })
        let s1 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
        let fb = fallback([s0, s1])

        expect(await fb.getHead()).toEqual({number: 7, hash: '0x7'})
    })
})
