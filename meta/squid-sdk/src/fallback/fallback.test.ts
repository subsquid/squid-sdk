import {BlockBatch, BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'

import {LogLevel, setLogLevelCallback} from '@subsquid/logger'

import {FallbackDataSource, RankedSource} from './fallback'
import {FallbackPolicy} from './policy'

// The supervisor logs its (static) cause logger at WARN; raise the floor to ERROR for the
// `sqd:fallback` namespace so the expected unhealthy transitions don't spam test output.
setLogLevelCallback((ns) => (ns.startsWith('sqd:fallback') ? LogLevel.ERROR : undefined))

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
        private opts: {head?: () => Promise<BlockRef>; finalizedHead?: () => Promise<BlockRef>; blocksCount?: number} = {},
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
        if (this.opts.finalizedHead) return this.opts.finalizedHead()
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

    // A stream error that takes at least `cooldownMs` to surface (a request timeout) must not let the
    // first failed source cool down and restart the sweep at index 0 before the third is tried.
    it('reaches the third source when each failure takes longer than the cooldown', async () => {
        let slowFail = (tag: string): StreamFn =>
            async function* () {
                await new Promise((r) => setTimeout(r, 30))
                throw new Error(tag)
            }
        let s0 = new MockSource(slowFail('e0'))
        let s1 = new MockSource(slowFail('e1'))
        let s2 = new MockSource(async function* (req) {
            yield batch([blk(req.from), blk(req.from + 1)])
        })
        let fb = fallback([s0, s1, s2], {cooldownMs: 10, maxLagBlocks: null, maxStalenessMs: null})

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect([s0.calls.length, s1.calls.length, s2.calls.length]).toEqual([1, 1, 1])
    }, 2000)
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

    it('clears the active source while all sources are down (metrics report none active)', async () => {
        let s0 = new MockSource(async function* (_req, call) {
            if (call === 0) {
                yield batch([blk(1)])
            }
            throw new Error('s0 down')
        })
        let s1 = new MockSource(async function* () {
            throw new Error('s1 down')
        })
        let fb = fallback([s0, s1], {allDownTimeoutMs: 0, allDownPollMs: 1, cooldownMs: 60_000})

        let it = fb.getStream({from: 1, to: 5})[Symbol.asyncIterator]()
        expect(numbers((await it.next()).value.blocks)).toEqual([1])
        expect(fb.activeIndex).toBe(0) // s0 serving

        // s0 then errors; s1 is down and s0 is now unhealthy → all-down → throws after the timeout.
        await expect(it.next()).rejects.toThrowError(/all fallback data sources/)
        expect(fb.activeIndex).toBeUndefined() // nothing driven ⇒ no active source reported
        expect(fb.metrics().sources.every((s) => !s.active)).toBe(true)
    })

    it('clears the freshness gauges during an all-down gap', async () => {
        // One source that global-stalls (no other source ⇒ nothing fresher) then errors. On the
        // error no eligible source remains, so the all-down path — not a switch — is the only thing
        // that can clear the freshness gauges it left set.
        let s0 = new MockSource(async function* () {
            yield batch([blk(50)])
            await wait(60)
            throw new Error('s0 down')
        })
        let fb = fallback([s0], {
            maxStalenessMs: 30,
            freshnessTickMs: 5,
            allDownTimeoutMs: 0,
            allDownPollMs: 1,
            cooldownMs: 60_000,
        })

        let it = fb.getStream({from: 50, to: 100})[Symbol.asyncIterator]()
        expect(numbers((await it.next()).value.blocks)).toEqual([50])

        // Pull the next batch so the staleness clock runs: stalls past maxStalenessMs with no fresher
        // alternative → global stall flagged on the active.
        let pending = it.next()
        await wait(45)
        expect(fb.chainStalled).toBe(true)
        expect(fb.activeIndex).toBe(0)

        // s0 then errors; nothing eligible remains → all-down. The gauges must not keep reporting s0.
        await expect(pending).rejects.toThrowError(/all fallback data sources/)
        expect(fb.activeIndex).toBeUndefined()
        expect(fb.chainStalled).toBe(false)
        expect(fb.staleness).toBe(0)
        expect(fb.lag).toBe(0)
        expect(fb.chainHead).toBeUndefined()
    }, 5000)
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

    it('eager: reclaims a recovered primary on its own — driven by the head-poll liveness probe', async () => {
        // No manual health driving and freshness fully disabled: the only thing that can promote s0
        // back to `healthy` is the higher-preference probe feeding its head poll into liveness.
        let now = 0
        let up = false
        let s0 = new MockSource(
            async function* (req, call) {
                if (call === 0) throw new Error('s0 down')
                expect(req.from).toBe(2)
                yield batch([blk(2)])
                yield batch([blk(3)])
            },
            {head: async () => (up ? {number: 100, hash: '0x'} : Promise.reject(new Error('down')))},
        )
        let s1 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2, '0x2-s1')])
            yield batch([blk(3, '0x3-s1')])
        })
        let fb = new FallbackDataSource<TestBlock>({
            sources: [ranked(s0, 's0'), ranked(s1, 's1')],
            getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
            policy: {
                preferPrimary: 'eager',
                cooldownMs: 1000,
                livenessRecoverThreshold: 1, // one good head poll is enough to recover
                headTtlMs: 0,
                maxLagBlocks: null, // freshness off — switch-up must stand on its own
                maxStalenessMs: null,
                clock: () => now,
            },
        })
        let it = fb.getStream({from: 1, to: 3})[Symbol.asyncIterator]()
        expect(numbers((await it.next()).value.blocks)).toEqual([1]) // s0 failed → s1 active

        up = true // s0's RPC answers again
        now = 1000 // and its cooldown elapses

        let rest: number[] = []
        for (let n = await it.next(); !n.done; n = await it.next()) rest.push(...numbers(n.value.blocks))
        expect(rest).toEqual([2, 3]) // reclaimed s0 served these
        expect(s0.calls).toHaveLength(2) // initial failure + reclaim
    })

    it('eager: invokes a recovered source capability probe and gates switch-up until it confirms', async () => {
        let now = 0
        let capable = false
        let probeCalls = 0
        let s0 = new MockSource(
            async function* (req, call) {
                if (call === 0) throw new Error('s0 down')
                yield batch([blk(2)])
            },
            {head: async () => ({number: 100, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2, '0x2-s1')])
            yield batch([blk(3, '0x3-s1')])
        })
        let fb = new FallbackDataSource<TestBlock>({
            sources: [
                {
                    name: 's0',
                    source: s0,
                    probeCapability: async () => {
                        probeCalls++
                        return {ok: capable}
                    },
                },
                ranked(s1, 's1'),
            ],
            getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
            policy: {
                preferPrimary: 'eager',
                cooldownMs: 1000,
                livenessRecoverThreshold: 1,
                headTtlMs: 0,
                maxLagBlocks: null,
                maxStalenessMs: null,
                clock: () => now,
            },
        })
        let it = fb.getStream({from: 1, to: 3})[Symbol.asyncIterator]()
        expect(numbers((await it.next()).value.blocks)).toEqual([1]) // s0 failed → s1 active

        now = 1000 // s0's head answers (liveness recovers), but its capability probe still says no
        let n = await it.next()
        await wait(0) // let the fire-and-forget capability probe settle

        expect(probeCalls).toBeGreaterThan(0) // the fallback actually runs the capability probe
        expect(fb.activeIndex).toBe(1) // unconfirmed capability ⇒ no switch-up
        expect(numbers(n.value.blocks)).toEqual([2]) // still served by s1
    })

    // s0 fails (→ s1 active at block 200), then recovers and is probed as a switch-up candidate.
    // The probe records the block the supervisor asked it to check.
    function probeAnchorScenario(s0head: number) {
        let now = 0
        let probedAt: number[] = []
        let s0 = new MockSource(
            async function* (_req, call) {
                if (call === 0) throw new Error('s0 down')
                yield batch([blk(999)])
            },
            {head: async () => ({number: s0head, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {
            yield batch([blk(200)])
            yield batch([blk(201)])
            yield batch([blk(202)])
        })
        let fb = new FallbackDataSource<TestBlock>({
            sources: [
                {name: 's0', source: s0, probeCapability: async (at) => (probedAt.push(at), {ok: false})},
                ranked(s1, 's1'),
            ],
            getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
            policy: {preferPrimary: 'eager', cooldownMs: 1000, headTtlMs: 0, maxLagBlocks: null, maxStalenessMs: null, clock: () => now},
        })
        return {fb, probedAt, recover: () => (now = 1000)}
    }

    it('anchors the capability probe to the committed frontier during backfill (committed + lookahead)', async () => {
        let {fb, probedAt, recover} = probeAnchorScenario(1_000_000) // head far ahead ⇒ backfill
        let it = fb.getStream({from: 200, to: 202})[Symbol.asyncIterator]()
        await it.next() // [200] from s1; s0 failed → unhealthy, committed frontier = 200
        recover() // s0 cooldown elapses → eligible to be probed
        await it.next()
        await wait(0) // settle the fire-and-forget probe

        expect(probedAt[0]).toBe(216) // 200 (committed) + 16 (capabilityLookahead); nowhere near the tip
    })

    it('clamps the capability probe off the chain tip when caught up (head - tipMargin)', async () => {
        let {fb, probedAt, recover} = probeAnchorScenario(210) // head just ahead ⇒ tip clamp wins
        let it = fb.getStream({from: 200, to: 202})[Symbol.asyncIterator]()
        await it.next()
        recover()
        await it.next()
        await wait(0)

        expect(probedAt[0]).toBe(194) // min(200 + 16, 210 - 16) = 194
    })

    it('labels a probe {ok:false}-without-cause failure as capability/unknown, not stale', async () => {
        let {fb, recover} = probeAnchorScenario(1_000_000)
        let it = fb.getStream({from: 200, to: 202})[Symbol.asyncIterator]()
        await it.next() // s0 down → s1 serves [200]
        recover() // s0 cooldown elapses → probed as a switch-up candidate; probe returns {ok:false}
        await it.next()
        await wait(0) // settle the fire-and-forget probe → s0 failed with the fabricated cause

        let cause = fb.metrics().sources[0].cause
        // A not-capable probe is not a freshness failure: reason must not be mislabeled `stale`.
        expect(cause).toMatchObject({check: 'capability', reason: 'unknown'})
        expect(cause?.reason).not.toBe('stale')
    })

    it('survives a capability probe that throws synchronously (fails as capability, flag not stranded)', async () => {
        let now = 0
        let s0 = new MockSource(
            async function* (_req, call) {
                if (call === 0) throw new Error('s0 down')
                yield batch([blk(999)])
            },
            {head: async () => ({number: 1_000_000, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {
            yield batch([blk(200)])
            yield batch([blk(201)])
            yield batch([blk(202)])
        })
        let fb = new FallbackDataSource<TestBlock>({
            sources: [
                // A misbehaving custom probe that throws *synchronously*, before returning a Promise.
                {
                    name: 's0',
                    source: s0,
                    probeCapability: () => {
                        throw new Error('sync boom')
                    },
                },
                ranked(s1, 's1'),
            ],
            getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
            policy: {preferPrimary: 'eager', cooldownMs: 1000, headTtlMs: 0, maxLagBlocks: null, maxStalenessMs: null, clock: () => now},
        })

        let it = fb.getStream({from: 200, to: 202})[Symbol.asyncIterator]()
        await it.next() // s0 down → s1 serves [200]
        now = 1000 // s0 cooldown elapses → probed as a switch-up candidate; the probe throws synchronously
        await it.next()
        await wait(0) // settle the fire-and-forget probe

        // The sync throw must be normalized into a rejection routed to failSource as a *capability*
        // failure — not escape #maybeProbeCapability (surfacing as a liveness error and stranding the
        // #capabilityProbing flag at true, which would block every future probe for s0). Reaching the
        // capability-labeled cause proves the `.finally` that clears the flag also ran.
        expect(fb.metrics().sources[0].cause).toMatchObject({check: 'capability'})
    })
})

const hang = () => new Promise(() => {})
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('FallbackDataSource — freshness (M1)', () => {
    it('(a) lag: fails over once it falls behind the independent head (after arming at the tip)', async () => {
        let s1heads = [95, 110] // first read arms (lag 5), second trips (lag 19)
        // s0's own claim stops at 91: the source itself is behind, not just the stream.
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(90)])
                yield batch([blk(91)])
                yield batch([blk(92)]) // not reached
            },
            {head: async () => ({number: 91, hash: '0x'})},
        )
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
        expect(fb.chainStalled).toBe(false) // cleared once progress resumed on the new source
    }, 5000)

    it('(d2) global stall: keeps probing the held source, and recovers when one becomes fresher', async () => {
        // The active hangs forever; recovery must come from continued probing of the other source.
        let s0 = new MockSource(async function* () {
            yield batch([blk(50)])
            await hang()
        })

        let s1heads = [50, 50, 50] // global stall (same head) for a while...
        let probedCapability = 0
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(51)
                yield batch([blk(51)])
            },
            {head: async () => ({number: s1heads.shift() ?? 51, hash: '0x'})}, // ...then it advances to 51
        )
        let fb = new FallbackDataSource<TestBlock>({
            sources: [
                ranked(s0, 's0'),
                {name: 's1', source: s1, probeCapability: async () => (probedCapability++, {ok: true})},
            ],
            getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
            policy: {maxStalenessMs: 30, freshnessTickMs: 5, headTtlMs: 0, maxLagBlocks: null, cooldownMs: 60_000},
        })

        let it = fb.getStream({from: 50, to: 100})[Symbol.asyncIterator]()
        expect(numbers((await it.next()).value.blocks)).toEqual([50])

        // While held, the supervisor keeps polling the other source — liveness *and* capability —
        // so it is positioned to notice recovery.
        let next = it.next()
        await wait(60)
        expect(fb.chainStalled).toBe(true)
        expect(s1heads.length).toBeLessThan(3) // s1's head was (re)polled during the hold (liveness)
        expect(probedCapability).toBeGreaterThan(0) // capability probe fired during the hold

        // s1's head advances past us → fail over to it, recovering without the active ever resolving.
        expect(numbers((await next).value.blocks)).toEqual([51])
        expect(fb.activeIndex).toBe(1)
        expect(fb.chainStalled).toBe(false)
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

    it('(g) resets freshness gauges on a switch (no stale lag from the old source)', async () => {
        let s1heads = [95, 110] // arm at lag 5, then trip at lag 19
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(90)])
                yield batch([blk(91)])
            },
            {head: async () => ({number: 91, hash: '0x'})}, // the source's own claim lags too
        )
        // Empty standby: after failover the stream ends immediately, so no boundary recomputes
        // freshness — exposing whether the switch itself cleared the old source's lag.
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: s1heads.shift() ?? 110, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 90, to: 93})))).toEqual([90, 91])
        expect(fb.activeIndex).toBe(1)
        // The switch (setActive) must clear ALL freshness gauges the old source populated, not just
        // lag: the lag trigger also recorded chainHead (~110). None may survive onto the new source.
        expect(fb.lag).toBe(0) // not the stale 19 the lag trigger recorded against s0
        expect(fb.sourceLag).toBe(0)
        expect(fb.staleness).toBe(0)
        expect(fb.chainStalled).toBe(false)
        expect(fb.chainHead).toBeUndefined()
    })

    it('(h) re-arms lag per stream: a reused instance does not inherit "at tip" for a backfill', async () => {
        let phase = 1
        let s0 = new MockSource(async function* () {
            if (phase === 1) {
                yield batch([blk(100)])
            } else {
                yield batch([blk(1)])
                yield batch([blk(2)])
            }
        })
        // Phase 1: head sits at s0 (arms the lag trigger). Phase 2: head is far ahead (backfill).
        let s1 = new MockSource(async function* () {}, {
            head: async () => ({number: phase === 1 ? 100 : 1_000_000, hash: '0x'}),
        })
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        // Stream 1 reaches the tip → arms the lag trigger on the instance.
        expect(numbers(await collect(fb.getStream({from: 100, to: 100})))).toEqual([100])

        // Stream 2 on the SAME instance backfills far behind head. If the armed state leaked, the
        // first boundary would trip (lag ~1e6 > 10) and fail over; a per-stream reset prevents that.
        phase = 2
        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(fb.activeIndex).toBe(0) // stayed on s0 — no spurious failover
    })

    it('(i) does not arm lag while the reference is behind us (stale standby) — no spurious failover', async () => {
        // The standby is first *behind* the active (negative lag), then jumps to the real tip while
        // the active is still backfilling. Arming on the negative lag would let that jump trip a
        // spurious failover; gating arming on `lag >= 0` keeps us on the active.
        let s1heads = [40, 1_000] // behind us at 50 (lag -10), then far ahead
        let s0 = new MockSource(async function* () {
            yield batch([blk(50)])
            yield batch([blk(51)])
            yield batch([blk(52)])
        })
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: s1heads.shift() ?? 1_000, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 50, to: 52})))).toEqual([50, 51, 52])
        expect(fb.activeIndex).toBe(0) // never armed (was ahead of the reference) ⇒ no lag failover
    })
})

describe('FallbackDataSource — a primary that stops at its own head (dataset without real-time data)', () => {
    it('fails over once the idle primary is more than maxLagBlocks behind', async () => {
        // s0 serves 1..2, then sits at its own head and only returns empty polls. Its empty batches
        // keep the staleness clock from ever tripping and it never gets within maxLagBlocks of the
        // reference, so only an empty batch can arm the lag trigger.
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                yield batch([blk(2)])
                for (let i = 0; i < 20; i++) yield batch([])
            },
            {head: async () => ({number: 2, hash: '0x'})},
        )
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(3)
                yield batch([blk(3)])
            },
            {head: async () => ({number: 1_000, hash: '0x'})},
        )
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 1, to: 3})))).toEqual([1, 2, 3])
        expect(fb.activeIndex).toBe(1)
    })

    it('does not switch back up to a recovered primary whose head is behind the frontier', async () => {
        // s0 is healthy again but its head (0) is below what s1 already committed: reclaiming it
        // would park the stream on a source with nothing to serve. s1 keeps serving.
        let s0 = new MockSource(
            async function* (_req, call) {
                if (call === 0) throw new Error('s0 down')
                for (let i = 0; i < 20; i++) yield batch([])
            },
            {head: async () => ({number: 0, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2)])
            yield batch([blk(3)])
            yield batch([blk(4)])
        })
        let now = 0
        let fb = fallback([s0, s1], {
            maxLagBlocks: null,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 1000,
            clock: () => now,
        })
        let it = fb.getStream({from: 1, to: 4})[Symbol.asyncIterator]()
        let got = numbers((await it.next()).value.blocks) // [1] from s1; s0 failed internally
        expect(got).toEqual([1])

        now = 1000 // past the cooldown
        fb.health[0].onLivenessPass()
        fb.health[0].onLivenessPass()
        fb.health[0].onLivenessPass()
        expect(fb.health[0].state).toBe('healthy')

        for (let n = await it.next(); !n.done; n = await it.next()) got.push(...numbers(n.value.blocks))
        expect(got).toEqual([1, 2, 3, 4])
        expect(s0.calls).toHaveLength(1) // never reclaimed while behind
    })
})

describe('FallbackDataSource — a primary that stops at its own head: edge cases', () => {
    it('does not fail over a finalized stream idle at the finalized head', async () => {
        // Every source's latest head (1000) is ahead of the finalized head (936). An empty batch at
        // the finalized head must not count as lagging against those unfinalized heads.
        let heads = {
            head: async () => ({number: 1000, hash: '0x'}),
            finalizedHead: async () => ({number: 936, hash: '0x'}),
        }
        let s0 = new MockSource(async function* () {
            yield batch([blk(936)])
            for (let i = 0; i < 5; i++) yield batch([])
        }, heads)
        let s1 = new MockSource(async function* () {}, heads)
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getFinalizedStream({from: 936})))).toEqual([936])
        expect(fb.activeIndex).toBe(0)
        expect(s1.calls).toHaveLength(0)
    })

    it('fails a finalized stream over when the idle primary is behind the others\' finalized heads', async () => {
        // The finalized-stream variant of the parked primary: s0 stops at finalized block 2, s1 is
        // finalized up to 100_000. Compared against finalized heads, s0 is lagging.
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                yield batch([blk(2)])
                for (let i = 0; i < 20; i++) yield batch([])
            },
            {head: async () => ({number: 2, hash: '0x'}), finalizedHead: async () => ({number: 2, hash: '0x'})},
        )
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(3)
                yield batch([blk(3)])
            },
            {head: async () => ({number: 100_100, hash: '0x'}), finalizedHead: async () => ({number: 100_000, hash: '0x'})},
        )
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 60_000,
            finalizedLagGraceMs: 0,
        })

        expect(numbers(await collect(fb.getFinalizedStream({from: 1, to: 3})))).toEqual([1, 2, 3])
        expect(fb.activeIndex).toBe(1)
    })

    it('fails a parked finalized stream over only once the lag outlasts finalizedLagGraceMs', async () => {
        let now = 0
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                for (let i = 0; i < 20; i++) {
                    now += 10_000 // each empty long-poll takes 10 s
                    yield batch([])
                }
            },
            {head: async () => ({number: 1, hash: '0x'}), finalizedHead: async () => ({number: 1, hash: '0x'})},
        )
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(2)
                expect(now).toBeGreaterThanOrEqual(60_000)
                yield batch([blk(2)])
            },
            {head: async () => ({number: 1000, hash: '0x'}), finalizedHead: async () => ({number: 900, hash: '0x'})},
        )
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 1e9, clock: () => now})

        expect(numbers(await collect(fb.getFinalizedStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(fb.activeIndex).toBe(1)
    })

    it('keeps a finalized primary through a finality step another source reported first', async () => {
        // Finality advances by 32 blocks; the standby reports the step one poll before the primary
        // delivers it. That is not a stuck primary, so it must keep serving.
        let standbyFinalized = 100
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(100)]) // at the finalized tip: the lag trigger arms
                standbyFinalized = 132 // the standby sees the next epoch first
                yield batch([])
                yield batch([blk(132)])
            },
            {head: async () => ({number: 140, hash: '0x'}), finalizedHead: async () => ({number: 100, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {}, {
            head: async () => ({number: 140, hash: '0x'}),
            finalizedHead: async () => ({number: standbyFinalized, hash: '0x'}),
        })
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getFinalizedStream({from: 100, to: 132})))).toEqual([100, 132])
        expect(fb.activeIndex).toBe(0)
        expect(s1.calls).toHaveLength(0)
    })

    it('reports the head of the source the stream is driving, not of a recovered parked primary', async () => {
        // s0 is parked at 100 and fails over to s1 (head 30_000). Once s0's cooldown ends it is
        // eligible again, but its head would make the processor think it is at the tip.
        let now = 0
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(100)])
                for (let i = 0; i < 5; i++) yield batch([])
            },
            {head: async () => ({number: 100, hash: '0x'})},
        )
        let s1 = new MockSource(
            async function* () {
                yield batch([blk(101)])
                yield batch([blk(102)])
            },
            {head: async () => ({number: 30_000, hash: '0x'})},
        )
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 1000,
            preferPrimary: 'onFailureOnly',
            clock: () => now,
        })
        let it = fb.getStream({from: 100, to: 102})[Symbol.asyncIterator]()
        expect(numbers((await it.next()).value.blocks)).toEqual([100])
        expect(numbers((await it.next()).value.blocks)).toEqual([]) // s0 idle: failed over after this
        expect(numbers((await it.next()).value.blocks)).toEqual([101]) // from s1
        expect(fb.activeIndex).toBe(1)

        now = 1000 // s0's cooldown is over: eligible again
        expect(fb.health[0].state).not.toBe('unhealthy')
        expect((await fb.getHead()).number).toBe(30_000)
    })

    it('retries the streaming source through a head blip instead of reporting the parked primary', async () => {
        let now = 0
        let blips = 1
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(100)])
                for (let i = 0; i < 5; i++) yield batch([])
            },
            {head: async () => ({number: 100, hash: '0x'})},
        )
        let s1 = new MockSource(
            async function* () {
                yield batch([blk(101)])
                yield batch([blk(102)])
            },
            {
                head: async () => {
                    if (blips-- > 0) throw new Error('transient')
                    return {number: 30_000, hash: '0x'}
                },
            },
        )
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 1000,
            preferPrimary: 'onFailureOnly',
            clock: () => now,
        })
        let it = fb.getStream({from: 100, to: 102})[Symbol.asyncIterator]()
        await it.next() // [100] from s0
        await it.next() // empty: s0 idle, failed over
        expect(numbers((await it.next()).value.blocks)).toEqual([101]) // from s1

        now = 1000
        blips = 1 // one transient failure on the streaming source's head
        expect((await fb.getHead()).number).toBe(30_000)
    })

    it('keeps the grace timer through transient failures of the idle confirmation', async () => {
        // A finalized primary parked at its head from the start (never armed at the tip). Every other
        // own-head request fails; those boundaries must not restart the grace period.
        let now = 0
        let headCalls = 0
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                for (let i = 0; i < 20; i++) {
                    now += 10_000
                    yield batch([])
                }
            },
            {
                head: async () => ({number: 1, hash: '0x'}),
                finalizedHead: async () => {
                    if (headCalls++ % 2 === 1) throw new Error('transient')
                    return {number: 1, hash: '0x'}
                },
            },
        )
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(2)
                yield batch([blk(2)])
            },
            {head: async () => ({number: 1000, hash: '0x'}), finalizedHead: async () => ({number: 900, hash: '0x'})},
        )
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 1e9,
            activeHeadTimeoutMs: null,
            clock: () => now,
        })

        expect(numbers(await collect(fb.getFinalizedStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(fb.activeIndex).toBe(1)
        expect(now).toBeLessThanOrEqual(100_000)
    })

    it('starts a new grace period after the lag reference was unavailable', async () => {
        // Lag first exceeds the threshold at t=0, then the standby cannot be polled while the primary
        // catches up. A later step at t=70 s is a new episode and must get its own grace period.
        let now = 0
        let standby: (() => Promise<BlockRef>) = async () => ({number: 132, hash: '0x'})
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(100)])
                yield batch([]) // lag 32 seen at t=0: grace starts
                standby = async () => {
                    throw new Error('standby down')
                }
                now = 70_000
                yield batch([blk(132)]) // no reference here
                standby = async () => ({number: 164, hash: '0x'})
                yield batch([]) // new lag at t=70 s: must not fail over at once
                yield batch([blk(164)])
            },
            {head: async () => ({number: 200, hash: '0x'}), finalizedHead: async () => ({number: 100, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {}, {
            head: async () => ({number: 200, hash: '0x'}),
            finalizedHead: () => standby(),
        })
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 0,
            livenessFailThreshold: 100,
            clock: () => now,
        })

        expect(numbers(await collect(fb.getFinalizedStream({from: 100, to: 164})))).toEqual([100, 132, 164])
        expect(fb.activeIndex).toBe(0)
        expect(s1.calls).toHaveLength(0)
    })

    it('does not ask the active source for its head once the lag trigger is armed', async () => {
        // At the tip the trigger is armed already, so an empty batch cannot change the outcome.
        let headCalls = 0
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                for (let i = 0; i < 20; i++) yield batch([])
                yield batch([blk(2)])
            },
            {
                head: async () => {
                    headCalls++
                    return {number: 2, hash: '0x'}
                },
            },
        )
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: 2, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(fb.activeIndex).toBe(0)
        expect(headCalls).toBe(0)
    })

    it('lets the next source backfill after leaving an idle one (the idle signal is not latched)', async () => {
        // s0 stops at 100; s1 is a source with more history (head 10_000) that is still backfilling
        // far below the reference head of s2. Only s0 should be failed over.
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(100)])
                for (let i = 0; i < 5; i++) yield batch([])
            },
            {head: async () => ({number: 100, hash: '0x'})},
        )
        let s1 = new MockSource(
            async function* (req) {
                expect(req.from).toBe(101)
                yield batch([blk(101)])
                yield batch([blk(102)])
                yield batch([blk(103)])
            },
            {head: async () => ({number: 10_000, hash: '0x'})},
        )
        let s2 = new MockSource(async function* () {}, {head: async () => ({number: 1_000_000, hash: '0x'})})
        let fb = fallback([s0, s1, s2], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 60_000,
            preferPrimary: 'onFailureOnly',
        })

        expect(numbers(await collect(fb.getStream({from: 100, to: 103})))).toEqual([100, 101, 102, 103])
        expect(fb.activeIndex).toBe(1)
        expect(s2.calls).toHaveLength(0)
    })

    it('does not treat a finality-only batch during catch-up as idle', async () => {
        // Some sources emit empty, finality-only batches while still backfilling. s0's own head
        // (500) is far above what it has delivered, so it is not idle and must keep serving.
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                yield batch([], {number: 1, hash: '0x1'})
                yield batch([blk(2)])
            },
            {head: async () => ({number: 500, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: 1_000_000, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(fb.activeIndex).toBe(0)
        expect(s1.calls).toHaveLength(0)
    })

    it('does not ask the active source for its head when the lag trigger is disabled', async () => {
        let headCalls = 0
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                yield batch([])
                yield batch([blk(2)])
            },
            {
                head: async () => {
                    headCalls++
                    return {number: 2, hash: '0x'}
                },
            },
        )
        let fb = fallback([s0], {maxLagBlocks: null, maxStalenessMs: null, headTtlMs: 0})

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(headCalls).toBe(0)
    })

    it('does not ask the only source for its head: there is nothing to fail over to', async () => {
        // A single source never has an independent reference, so idleness cannot matter. A hung
        // head request must not hold up the blocks that follow the empty batch.
        let headCalls = 0
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(1)])
                yield batch([])
                yield batch([blk(2)])
            },
            {
                head: () => {
                    headCalls++
                    return new Promise<BlockRef>(() => {}) // hangs
                },
            },
        )
        let fb = fallback([s0], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, activeHeadTimeoutMs: null})

        expect(numbers(await collect(fb.getStream({from: 1, to: 2})))).toEqual([1, 2])
        expect(headCalls).toBe(0)
    }, 2000)

    it('reclaims a recovered primary that trails the frontier by less than maxLagBlocks', async () => {
        // A real-time primary whose polled head is one block behind the active source must still be
        // reclaimed: the lag trigger would not fail it over at that distance either.
        let s0 = new MockSource(
            async function* (req, call) {
                if (call === 0) throw new Error('s0 down')
                expect(req.from).toBe(2)
                yield batch([blk(2)])
                yield batch([blk(3)])
            },
            {head: async () => ({number: 0, hash: '0x'})}, // frontier is 1 when it is polled
        )
        let s1 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2, '0x2-s1')])
            yield batch([blk(3, '0x3-s1')])
        })
        let now = 0
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 1000,
            clock: () => now,
        })
        let it = fb.getStream({from: 1, to: 3})[Symbol.asyncIterator]()
        let hashes = (await it.next()).value.blocks.map((b: TestBlock) => b.header.hash) // [0x1] from s1

        now = 1000
        for (let k = 0; k < 3; k++) fb.health[0].onLivenessPass()

        for (let n = await it.next(); !n.done; n = await it.next()) hashes.push(...n.value.blocks.map((b) => b.header.hash))
        expect(hashes).toEqual(['0x1', '0x2', '0x3']) // reclaimed s0 after block 1
        expect(s0.calls).toHaveLength(2)
    })

    it('switches up to a caught-up source even when a more-preferred one is behind', async () => {
        // s0 (head 0) and s1 (head 1000) both recover while s2 serves. s0 is behind the frontier,
        // so the switch-up must land on s1, not stall on s0 or skip recovery altogether.
        let s0 = new MockSource(
            async function* (_req, call) {
                if (call === 0) throw new Error('s0 down')
                for (let i = 0; i < 5; i++) yield batch([])
            },
            {head: async () => ({number: 0, hash: '0x'})},
        )
        let s1 = new MockSource(
            async function* (req, call) {
                if (call === 0) throw new Error('s1 down')
                expect(req.from).toBe(2)
                yield batch([blk(2)])
                yield batch([blk(3)])
            },
            {head: async () => ({number: 1000, hash: '0x'})},
        )
        let s2 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2, '0x2-s2')])
            yield batch([blk(3, '0x3-s2')])
        })
        let now = 0
        let fb = fallback([s0, s1, s2], {
            maxLagBlocks: null,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 1000,
            clock: () => now,
        })
        let it = fb.getStream({from: 1, to: 3})[Symbol.asyncIterator]()
        let got = numbers((await it.next()).value.blocks)
        expect(got).toEqual([1]) // from s2

        now = 1000
        for (let i of [0, 1]) for (let k = 0; k < 3; k++) fb.health[i].onLivenessPass()

        let hashes: string[] = []
        for (let n = await it.next(); !n.done; n = await it.next()) hashes.push(...n.value.blocks.map((b) => b.header.hash))
        expect(hashes).toEqual(['0x2', '0x3']) // served by s1
        expect(s0.calls).toHaveLength(1)
    })
})

describe('FallbackDataSource — served vs claimed heights', () => {
    // A healthy primary whose claim keeps up with the reference, while the consumer is slow: the
    // stream's served frontier falls ever further behind both claims.
    function slowConsumer(finalized: boolean) {
        let tip = 100
        let s0 = new MockSource(
            async function* () {
                for (let n = 90; n <= 100; n++) {
                    yield batch([blk(n)])
                    tip += 10 // the chain moves faster than the handler consumes it
                }
            },
            {
                head: async () => ({number: tip, hash: '0x'}),
                finalizedHead: async () => ({number: tip, hash: '0x'}),
            },
        )
        let s1 = new MockSource(async function* () {}, {
            head: async () => ({number: tip, hash: '0x'}),
            finalizedHead: async () => ({number: tip, hash: '0x'}),
        })
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            cooldownMs: 60_000,
            finalizedLagGraceMs: 0,
        })
        return {fb, s1, stream: finalized ? fb.getFinalizedStream({from: 90, to: 100}) : fb.getStream({from: 90, to: 100})}
    }

    for (let finalized of [false, true]) {
        it(`keeps a healthy primary when only the consumer is slow (${finalized ? 'finalized' : 'unfinalized'} stream)`, async () => {
            let {fb, s1, stream} = slowConsumer(finalized)
            let got = numbers(await collect(stream))
            expect(got).toEqual([90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100])
            expect(fb.activeIndex).toBe(0)
            expect(s1.calls).toHaveLength(0)
            expect(fb.lag).toBeGreaterThan(10) // the stream is behind...
            expect(fb.sourceLag).toBe(0) // ...but the source is not
        })
    }

    it('does not fail over on lag while the active source\'s claim is unknown', async () => {
        // The stream is behind the reference, but the active source's head request fails: nothing
        // shows that the source (rather than the consumer) is behind, so the boundary decides nothing.
        let s0 = new MockSource(async function* () {
            yield batch([blk(90)])
            yield batch([blk(91)])
            yield batch([blk(92)])
        })
        let s1heads = [95, 110, 120]
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: s1heads.shift() ?? 130, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 90, to: 92})))).toEqual([90, 91, 92])
        expect(fb.activeIndex).toBe(0)
    })

    it('refreshes a cached active claim before acting on a deficit against a fresher standby claim', async () => {
        // Both sources always claim the same tip. With a 5 s TTL, the standby's claim is refreshed at
        // t=11.5 s (160) while the active claim cached at t=8 s (140) is still valid: a 20-block
        // "deficit" that is only the age difference. The consumer is slow; nothing should fail over.
        let now = 0
        let tip = 115
        let fb: FallbackDataSource<TestBlock>
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(110)]) // t=0: delivery lag 5, arms the trigger
                now = 6000
                tip = 130
                yield batch([blk(111)])
                now = 8000
                tip = 140
                await fb.getHead() // records the active claim (140) at t=8 s
                yield batch([blk(112)])
                now = 11_500
                tip = 160
                yield batch([blk(113)])
            },
            {head: async () => ({number: tip, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: tip, hash: '0x'})})
        fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 5000, cooldownMs: 60_000, clock: () => now})

        expect(numbers(await collect(fb.getStream({from: 110, to: 113})))).toEqual([110, 111, 112, 113])
        expect(fb.activeIndex).toBe(0)
        expect(s1.calls).toHaveLength(0)
    })

    it('requests the active claim once per boundary when it is not cached', async () => {
        let activeCalls = 0
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(90)])
                yield batch([blk(91)])
                yield batch([blk(92)])
            },
            {
                head: async () => {
                    activeCalls++
                    return {number: 91, hash: '0x'}
                },
            },
        )
        // Arms at 95 (delivery lag 5), then shows a real deficit (110 vs the active claim 91).
        let s1heads = [95, 110]
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: s1heads.shift() ?? 110, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        await collect(fb.getStream({from: 90, to: 92}))
        expect(fb.activeIndex).toBe(1)
        expect(activeCalls).toBe(1) // one boundary needed the claim, and asked once
    })

    it('keeps the resume point per stream when two streams overlap', async () => {
        // A finalized backfill and a live stream on the same instance. The backfill's source fails
        // after the live stream moved to block 100; the backfill must resume after its own block 10.
        let s0 = new MockSource(async function* (req) {
            if (req.from === 10) {
                yield batch([blk(10)])
                throw new Error('backfill source down')
            }
            yield batch([blk(100)])
        })
        let s1 = new MockSource(async function* (req) {
            yield batch([blk(req.from, `0x${req.from}-s1`)])
        })
        let fb = fallback([s0, s1], {maxLagBlocks: null, maxStalenessMs: null, cooldownMs: 60_000})

        let backfill = fb.getFinalizedStream({from: 10, to: 11})[Symbol.asyncIterator]()
        let live = fb.getStream({from: 100, to: 100})[Symbol.asyncIterator]()
        expect(numbers((await backfill.next()).value.blocks)).toEqual([10])
        expect(numbers((await live.next()).value.blocks)).toEqual([100])
        // Both streams resume at once: the live one commits block 100 while the backfill fails over.
        let [b, l] = await Promise.all([backfill.next(), live.next()])
        expect(l.done).toBe(true)
        expect(numbers(b.value.blocks)).toEqual([11]) // not 101
        expect(s1.calls[0]).toMatchObject({from: 11, parentHash: '0x10'})
    })

    it('records the served height when a batch is delivered, before the consumer asks for more', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(90)])
            yield batch([blk(91)])
        })
        let fb = fallback([s0], {maxLagBlocks: 10, maxStalenessMs: null})
        let it = fb.getStream({from: 90, to: 91})[Symbol.asyncIterator]()
        await it.next()
        expect(fb.metrics().sources[0].servedHeight).toBe(90) // the handler is still on block 90
        await it.return?.()
    })

    it('derives the reported source lag from the known claims, independently of the failover gates', async () => {
        // At the tip, no lag check needs the active claim, but once it is known (head delegation),
        // the reported source lag is the plain claim difference: 105 − 100 = 5.
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(100)])
            },
            {head: async () => ({number: 100, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: 105, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 60_000, cooldownMs: 60_000})

        await collect(fb.getStream({from: 100, to: 100}))
        await fb.getHead()
        expect(fb.metrics().sourceLag).toBe(5)
    })

    it('reports served and claimed heights per source in metrics()', async () => {
        let s0 = new MockSource(
            async function* () {
                yield batch([blk(90)])
                yield batch([blk(91)])
            },
            {head: async () => ({number: 120, hash: '0x'})},
        )
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: 130, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        await collect(fb.getStream({from: 90, to: 91}))
        // Backfilling, so the lag check never needed s0's claim; head delegation records it.
        expect((await fb.getHead()).number).toBe(120)
        let m = fb.metrics()
        expect(m.sources[0]).toMatchObject({servedHeight: 91, claimedHeight: 120})
        expect(m.sources[1]).toMatchObject({claimedHeight: 130})
        expect(m.sources[1].servedHeight).toBeUndefined()
        expect(m.lag).toBe(39) // others' best claim (130) − served frontier (91)
    })
})

describe('FallbackDataSource — a source that claims the tip but does not deliver it', () => {
    // The clock is the test's: time that passes inside a source's generator is time the stream
    // waited on that source; time that passes in the consumer loop is the consumer's.
    type Env = {wait: (ms: number) => void; advanceChain: (blocks: number) => void}

    function setup(
        primary: (req: StreamRequest, env: Env) => AsyncGenerator<BlockBatch<TestBlock>>,
        policy: FallbackPolicy = {},
        opts: {tip?: number; primaryHead?: (env: Env) => Promise<BlockRef>} = {},
    ) {
        let now = 0
        let tip = opts.tip ?? 100
        let env = {
            wait: (ms: number) => {
                now += ms
            },
            advanceChain: (blocks: number) => {
                tip += blocks
            },
        }
        let claim = async () => ({number: tip, hash: '0x'})
        let primaryHead = opts.primaryHead
        let primaryClaim = primaryHead ? () => primaryHead(env) : claim
        let s0 = new MockSource((req) => primary(req, env), {head: primaryClaim, finalizedHead: primaryClaim})
        let s1 = new MockSource(
            async function* (req) {
                let blocks: TestBlock[] = []
                for (let n = req.from; n <= tip; n++) blocks.push(blk(n))
                yield batch(blocks)
            },
            {head: claim, finalizedHead: claim},
        )
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: 180_000,
            headTtlMs: 0,
            cooldownMs: 600_000,
            preferPrimary: 'onFailureOnly',
            clock: () => now,
            ...policy,
        })
        let consume = (ms: number) => {
            now += ms
        }
        return {fb, s0, s1, consume, tip: () => tip, now: () => now}
    }

    // Reads until the stream leaves the primary or ends; the consumer takes `consumerMs` per batch.
    async function drive(t: ReturnType<typeof setup>, stream: BlockStream<TestBlock>, consumerMs = 0) {
        let last: number | undefined
        for await (let b of stream) {
            if (b.blocks.length) last = b.blocks[b.blocks.length - 1].header.number
            if (t.fb.activeIndex !== 0) break
            t.consume(consumerMs)
        }
        return last
    }

    it('fails over a primary that claims the tip but only yields empty batches', async () => {
        // Its head keeps up with the chain, so claim against claim it is never behind; every empty
        // batch also resets the staleness clock. Only the time spent waiting on it shows the problem.
        let t = setup(async function* (req, env) {
            yield batch([blk(req.from)]) // at the tip: arms the lag trigger
            for (let i = 0; i < 100; i++) {
                env.wait(5000) // a long poll that returns nothing
                env.advanceChain(5)
                yield batch([])
            }
        })
        await drive(t, t.fb.getStream({from: 100}))

        expect(t.fb.activeIndex).toBe(1)
        expect(t.fb.health[0].cause?.reason).toBe('stale')
        // not before `maxStalenessMs` of waiting on the source has passed
        expect(t.now()).toBeGreaterThan(180_000)
        expect(t.now()).toBeLessThan(240_000)
    })

    it('fails over a primary that claims the tip but delivers slower than the chain grows', async () => {
        let t = setup(async function* (req, env) {
            yield batch([blk(req.from)])
            for (let n = req.from + 1; n < req.from + 200; n++) {
                env.wait(5000)
                env.advanceChain(5) // 5 blocks produced for each one delivered
                yield batch([blk(n)])
            }
        })
        await drive(t, t.fb.getStream({from: 100}))

        expect(t.fb.activeIndex).toBe(1)
        expect(t.fb.health[0].cause?.reason).toBe('stale')
    })

    for (let finalized of [false, true]) {
        let kind = finalized ? 'finalized' : 'unfinalized'
        it(`keeps a healthy primary when only the consumer is slow (${kind} stream, clocked)`, async () => {
            // The source has every batch ready at once; the handler takes 10 s per batch while the
            // chain moves on. All the time is the consumer's, however long it lasts.
            let t = setup(async function* (req, env) {
                for (let n = req.from; n < req.from + 200; n++) {
                    env.advanceChain(5)
                    yield batch([blk(n)])
                }
            })
            let req = {from: 100, to: 299}
            let stream = finalized ? t.fb.getFinalizedStream(req) : t.fb.getStream(req)
            expect(await drive(t, stream, 10_000)).toBe(299)

            expect(t.fb.activeIndex).toBe(0)
            expect(t.s1.calls).toHaveLength(0)
            expect(t.now()).toBeGreaterThan(1_800_000) // half an hour behind, never failed over
        })
    }

    it('keeps a primary that the consumer waits on a little, when the consumer takes most of the time', async () => {
        // 1 s of source time and 9 s of handler time per batch: the wait on the source adds up to
        // more than `maxStalenessMs`, but the source is not what holds the stream back.
        let t = setup(async function* (req, env) {
            for (let n = req.from; n < req.from + 400; n++) {
                env.wait(1000)
                env.advanceChain(5)
                yield batch([blk(n)])
            }
        })
        expect(await drive(t, t.fb.getStream({from: 100, to: 499}), 9000)).toBe(499)
        expect(t.fb.activeIndex).toBe(0)
    })

    it('keeps a primary that is working through a backlog and getting closer to the tip', async () => {
        // The stream arms at the tip, then the chain jumps 6000 blocks ahead. The source is the
        // bottleneck (the consumer is instant), but each batch brings the stream closer.
        let t = setup(async function* (req, env) {
            yield batch([blk(req.from)])
            env.advanceChain(6000)
            for (let n = req.from + 1; n <= 6100; n += 20) {
                env.wait(5000)
                env.advanceChain(2)
                yield batch(Array.from({length: 20}, (_, i) => blk(n + i)))
            }
        })
        let last = await drive(t, t.fb.getStream({from: 100, to: 6100}))

        expect(last).toBe(6100)
        expect(t.fb.activeIndex).toBe(0)
        expect(t.s1.calls).toHaveLength(0)
    })

    it('keeps a slow primary during a historical backfill that delivers blocks', async () => {
        // Never armed: the stream starts 100_000 blocks below the tip and the source is slower than
        // the chain. A backfill is not failed over for being slow, as before.
        let t = setup(
            async function* (req, env) {
                for (let n = req.from; n < req.from + 100; n++) {
                    env.wait(5000)
                    env.advanceChain(5)
                    yield batch([blk(n)])
                }
            },
            {},
            {tip: 100_000},
        )
        expect(await drive(t, t.fb.getStream({from: 100, to: 199}))).toBe(199)
        expect(t.fb.activeIndex).toBe(0)
    })

    it('fails over a primary that stops delivering in the middle of a backfill while claiming more', async () => {
        // Never armed, and not idle at its own claim (it claims the tip), so neither the lag trigger
        // nor the idle check applies; the empty batches keep the staleness clock quiet.
        let t = setup(
            async function* (req, env) {
                yield batch([blk(req.from)])
                for (let i = 0; i < 100; i++) {
                    env.wait(5000)
                    yield batch([])
                }
            },
            {},
            {tip: 100_000},
        )
        await drive(t, t.fb.getStream({from: 100}))

        expect(t.fb.activeIndex).toBe(1)
        expect(t.fb.health[0].cause?.reason).toBe('stale')
    })

    it('starts over when the stream gets back within maxLagBlocks of the tip', async () => {
        // Two spells behind the tip, 150 s of waiting each, with a batch that catches up in between:
        // neither spell reaches `maxStalenessMs`, and they do not add up.
        let t = setup(async function* (req, env) {
            let n = req.from
            yield batch([blk(n)])
            for (let spell = 0; spell < 2; spell++) {
                env.advanceChain(50)
                for (let i = 0; i < 30; i++) {
                    env.wait(5000)
                    yield batch([])
                }
                let blocks: TestBlock[] = []
                while (n < t.tip()) blocks.push(blk(++n))
                yield batch(blocks) // caught up
            }
        })
        expect(await drive(t, t.fb.getStream({from: 100, to: 200}))).toBe(200)
        expect(t.fb.activeIndex).toBe(0)
        expect(t.s1.calls).toHaveLength(0)
    })

    it('also covers a primary whose claim is unknown', async () => {
        // Its head request fails, so the lag trigger decides nothing; the stream still falls behind
        // while it waits on this source.
        let t = setup(
            async function* (req, env) {
                yield batch([blk(req.from)])
                for (let i = 0; i < 100; i++) {
                    env.wait(5000)
                    env.advanceChain(5)
                    yield batch([])
                }
            },
            {},
            {
                primaryHead: async () => {
                    throw new Error('head unavailable')
                },
            },
        )
        await drive(t, t.fb.getStream({from: 100}))
        expect(t.fb.activeIndex).toBe(1)
    })

    it('does not count the time of its own head requests as the consumer\'s', async () => {
        // The primary's head request hangs for a minute and then fails, after every empty batch.
        // That minute is neither the consumer's time nor a wait for a batch: the consumer is instant,
        // so the 5 s waits on the source are what holds the stream back.
        let t = setup(
            async function* (req, env) {
                yield batch([blk(req.from)])
                for (let i = 0; i < 100; i++) {
                    env.wait(5000)
                    env.advanceChain(5)
                    yield batch([])
                }
            },
            {},
            {
                primaryHead: async (env) => {
                    env.wait(60_000)
                    throw new Error('head request timed out')
                },
            },
        )
        await drive(t, t.fb.getStream({from: 100}))

        expect(t.fb.activeIndex).toBe(1)
        expect(t.fb.health[0].cause?.reason).toBe('stale')
    })

    it('compares progress with the chain over the same time span when the claims are cached', async () => {
        // The chain grows 1 block/s and claims are cached for 5 s, so a cached claim can be up to
        // 4 blocks old. The second window opens on a claim that is 4 s old and is judged on a fresh
        // one: the measured lag goes up by 1 while the stream actually got 3 blocks closer.
        let n = 100
        let deliver = (count: number) => batch(Array.from({length: count}, () => blk(++n)))
        let t = setup(
            async function* (_req, env) {
                let tick = (seconds: number) => {
                    env.wait(seconds * 1000)
                    env.advanceChain(seconds)
                }
                yield batch([blk(100)]) // t=0: 5 behind, arms the trigger
                env.advanceChain(500)
                for (let i = 0; i < 5; i++) {
                    tick(1)
                    yield deliver(1) // t=5: the claim is polled again, the first window opens
                }
                for (let i = 0; i < 180; i++) {
                    tick(1)
                    yield deliver(2) // twice the chain's pace: clearly catching up
                }
                tick(4)
                yield deliver(8) // t=189: first window judged on a claim polled at t=185; the next opens
                for (let i = 0; i < 181; i++) {
                    tick(1)
                    yield deliver(i < 3 ? 2 : 1) // 184 blocks in 181 s: 3 blocks closer
                }
                // t=370: the second window is judged on a claim polled just now
            },
            {headTtlMs: 5000},
            {tip: 105},
        )
        await drive(t, t.fb.getStream({from: 100}))

        expect(t.now()).toBe(370_000)
        expect(t.fb.activeIndex).toBe(0)
        expect(t.s1.calls).toHaveLength(0)
    })

    it('does not count a finality step from before the window as growth inside it', async () => {
        // Finalized stream, claims cached for 5 s. Finality steps 100 blocks ahead 2 s after a poll,
        // and the next window opens 2 s later, still on the cached claim. In that window there is no
        // step and the source serves 91 blocks: the stream gets 91 blocks closer.
        let n = 100
        let deliver = (count: number) => batch(Array.from({length: count}, () => blk(++n)))
        let t = setup(
            async function* (_req, env) {
                yield batch([blk(100)]) // t=0: 5 behind, arms the trigger
                env.advanceChain(1000)
                for (let i = 0; i < 5; i++) {
                    env.wait(1000)
                    yield deliver(1) // t=5: the claim is polled again, the first window opens
                }
                for (let i = 0; i < 180; i++) {
                    env.wait(1000)
                    yield deliver(4) // t=185: last poll before the step
                }
                env.wait(2000)
                env.advanceChain(100) // t=187: the finality step
                env.wait(2000)
                yield deliver(8) // t=189: the first window is judged and the next one opens
                for (let i = 0; i < 181; i++) {
                    env.wait(1000)
                    yield i % 2 === 0 ? deliver(1) : batch([])
                }
                // t=370: the second window is judged
            },
            {headTtlMs: 5000},
            {tip: 105},
        )
        await drive(t, t.fb.getFinalizedStream({from: 100}))

        expect(t.now()).toBe(370_000)
        expect(t.fb.activeIndex).toBe(0)
        expect(t.s1.calls).toHaveLength(0)
    })

    it('opens the window on the lag as it is after its own head request, not before', async () => {
        // The primary's first head request takes a minute, and the chain grows by 60 blocks in that
        // time. The window that opens right after it must start from the lag as it is then. The
        // source then serves 211 blocks while the chain grows by 181: the stream gets 30 closer.
        let n = 100
        let deliver = (count: number) => batch(Array.from({length: count}, () => blk(++n)))
        let headRequests = 0
        let t: ReturnType<typeof setup> = setup(
            async function* (_req, env) {
                yield batch([blk(100)]) // t=0: 5 behind, arms the trigger
                env.advanceChain(1000)
                for (let i = 0; i < 182; i++) {
                    env.wait(1000)
                    env.advanceChain(1)
                    yield deliver(i > 0 && i <= 30 ? 2 : 1)
                }
            },
            {},
            {
                tip: 105,
                primaryHead: async (env) => {
                    if (headRequests++ === 0) {
                        env.wait(60_000)
                        env.advanceChain(60)
                    }
                    return {number: t.tip(), hash: '0x'}
                },
            },
        )
        await drive(t, t.fb.getStream({from: 100}))

        expect(t.now()).toBe(242_000)
        expect(t.fb.activeIndex).toBe(0)
        expect(t.s1.calls).toHaveLength(0)
    })

    it('does not let a cached claim close the window while the stream is still behind', async () => {
        // Chain and source both move 5 blocks/s and the stream stays 20 behind. With claims cached
        // for 5 s, the lag measured against a cached claim drops to 10 and below before every new
        // poll, which looks like catching up although the stream never does.
        let n = 100
        let t = setup(
            async function* (_req, env) {
                yield batch([blk(100)]) // t=0: 5 behind, arms the trigger
                env.advanceChain(15)
                for (let i = 0; i < 400; i++) {
                    env.wait(1000)
                    env.advanceChain(5)
                    yield batch(Array.from({length: 5}, () => blk(++n)))
                }
            },
            {headTtlMs: 5000},
            {tip: 105},
        )
        await drive(t, t.fb.getStream({from: 100}))

        expect(t.fb.activeIndex).toBe(1)
        expect(t.fb.health[0].cause?.reason).toBe('stale')
        // the window is neither closed nor judged early when the cached claim is corrected
        expect(t.now()).toBeGreaterThan(180_000)
        expect(t.now()).toBeLessThan(200_000)
    })

    it('does not take a backfill for armed because a cached claim made it look close to the tip', async () => {
        // Never within maxLagBlocks of the tip: chain and source both move 5 blocks/s, 20 apart from
        // the start. Against a claim cached for 5 s the lag reads 10 and less before every new poll;
        // that must not arm the trigger, or this delivering backfill would be failed over.
        let n = 99
        let t = setup(
            async function* (_req, env) {
                for (let i = 0; i < 400; i++) {
                    env.wait(1000)
                    env.advanceChain(5)
                    yield batch(Array.from({length: 5}, () => blk(++n)))
                }
            },
            {headTtlMs: 5000},
            {tip: 119},
        )
        expect(await drive(t, t.fb.getStream({from: 100, to: 2099}))).toBe(2099)

        expect(t.fb.activeIndex).toBe(0)
        expect(t.s1.calls).toHaveLength(0)
    })

    it('arms at the tip with three sources whose claims are never polled at the same time', async () => {
        // The third source starts in its cooldown, so its claim is first polled a second after the
        // second one's, and their 5 s caches expire at different batch boundaries from then on.
        // (With the staleness trigger on, its own polls would bring them back in step.) The stream
        // catches up and follows the tip for a minute. Then the chain speeds up to 5 blocks/s while
        // the primary still delivers one, and reports its own head truthfully.
        let now = 0
        let extra = 0
        let tip = () => 1100 + Math.floor(now / 1000) + extra
        let claim = async () => ({number: tip(), hash: '0x'})
        let served = 99
        let slow = false
        let s0 = new MockSource(
            async function* (req) {
                let next = req.from
                for (let i = 0; i < 3; i++) {
                    now += 1000
                    yield batch(Array.from({length: 300}, () => blk(next++))) // still in the backlog
                }
                for (let i = 0; i < 60; i++) {
                    now += 1000
                    let blocks: TestBlock[] = []
                    while (next <= tip()) blocks.push(blk(next++))
                    served = next - 1
                    yield batch(blocks)
                }
                slow = true
                for (let i = 0; i < 60; i++) {
                    now += 1000
                    extra += 4
                    served = next
                    yield batch([blk(next++)])
                }
            },
            {head: async () => ({number: slow ? served : tip(), hash: '0x'})},
        )
        let standby = () =>
            new MockSource(
                async function* (req) {
                    let blocks: TestBlock[] = []
                    for (let n = req.from; n <= tip(); n++) blocks.push(blk(n))
                    yield batch(blocks)
                },
                {head: claim},
            )
        let s1 = standby()
        let s2 = standby()
        let fb = fallback([s0, s1, s2], {
            maxStalenessMs: null,
            headTtlMs: 5000,
            cooldownMs: 2000,
            preferPrimary: 'onFailureOnly',
            clock: () => now,
        })
        fb.health[2].onStreamError()

        for await (let _ of fb.getStream({from: 100})) {
            if (fb.activeIndex !== 0) break
        }
        expect(fb.activeIndex).toBe(1)
        expect(fb.health[0].cause?.reason).toBe('lag')
    })

    it('is off when the staleness trigger is disabled', async () => {
        let t = setup(
            async function* (req, env) {
                yield batch([blk(req.from)])
                for (let i = 0; i < 100; i++) {
                    env.wait(5000)
                    env.advanceChain(5)
                    yield batch([])
                }
            },
            {maxStalenessMs: null},
        )
        await drive(t, t.fb.getStream({from: 100}))
        expect(t.fb.activeIndex).toBe(0)
        expect(t.s1.calls).toHaveLength(0)
    })
})

describe('FallbackDataSource — taking back a source that was failed over for not delivering', () => {
    // Both sources follow a chain that makes one block per second and always claim its tip. The
    // second source delivers everything up to the tip once a second. The primary does the same
    // while `primaryKeepsUp(now)`, and otherwise delivers one block per 5 s. While `secondDown(now)`,
    // the second source fails its stream and its head requests. The consumer is instant.
    async function follow(
        policy: FallbackPolicy,
        durationMs: number,
        primaryKeepsUp: (now: number) => boolean = () => false,
        secondDown: (now: number) => boolean = () => false,
    ) {
        let now = 0
        let tip = () => 100 + Math.floor(now / 1000)
        let claim = async () => ({number: tip(), hash: '0x'})
        let upToTip = (from: number) => {
            let blocks: TestBlock[] = []
            for (let n = from; n <= tip(); n++) blocks.push(blk(n))
            return blocks
        }
        let s0 = new MockSource(
            async function* (req) {
                let next = req.from
                while (true) {
                    if (primaryKeepsUp(now)) {
                        now += 1000
                        let blocks = upToTip(next)
                        next += blocks.length
                        yield batch(blocks)
                    } else {
                        now += 5000
                        yield batch(next <= tip() ? [blk(next++)] : [])
                    }
                }
            },
            {head: claim, finalizedHead: claim},
        )
        let secondClaim = async () => {
            if (secondDown(now)) throw new Error('second source is down')
            return claim()
        }
        let s1 = new MockSource(
            async function* (req) {
                let next = req.from
                while (true) {
                    if (secondDown(now)) throw new Error('second source is down')
                    now += 1000
                    let blocks = upToTip(next)
                    next += blocks.length
                    yield batch(blocks)
                }
            },
            {head: secondClaim, finalizedHead: secondClaim},
        )
        let fb = fallback([s0, s1], {clock: () => now, ...policy})

        let switches: {at: number; to: number}[] = []
        let onPrimaryMs = 0
        let maxLag = 0
        let last = 99
        let prevNow = 0
        let prevActive: number | undefined
        for await (let b of fb.getStream({from: 100})) {
            let active = fb.activeIndex!
            if (prevActive != null && active !== prevActive) switches.push({at: prevNow, to: active})
            if (active === 0) onPrimaryMs += now - prevNow
            if (b.blocks.length) last = b.blocks[b.blocks.length - 1].header.number
            maxLag = Math.max(maxLag, tip() - last)
            prevNow = now
            prevActive = active
            if (now >= durationMs) break
        }
        return {fb, switches, primaryShare: onPrimaryMs / now, maxLag}
    }

    const HOUR = 3_600_000

    it('does not go back to it as soon as its cooldown ends (default policy)', async () => {
        // The primary claims the tip the whole time, so a claim-based check would take it back after
        // every 30 s cooldown and the stream would spend most of the hour on it.
        let r = await follow({}, HOUR)

        expect(r.switches.map((s) => s.to)).toEqual([1, 0, 1]) // failed, tried once more, failed again
        expect(r.switches[1].at - r.switches[0].at).toBeGreaterThanOrEqual(1_800_000) // default delay
        expect(r.primaryShare).toBeLessThan(0.15)
        expect(r.fb.activeIndex).toBe(1)
    })

    it('doubles the delay each time the source fails the same way again', async () => {
        let r = await follow({reclaimBackoffMs: 60_000, maxStalenessMs: 20_000, cooldownMs: 1000}, HOUR)

        let failedAt = r.switches.filter((s) => s.to === 1).map((s) => s.at)
        let reclaimedAt = r.switches.filter((s) => s.to === 0).map((s) => s.at)
        let delays = reclaimedAt.map((at, i) => at - failedAt[i])
        expect(delays.length).toBeGreaterThanOrEqual(4)
        for (let i = 0; i < 4; i++) {
            expect(delays[i]).toBeGreaterThanOrEqual(60_000 * 2 ** i)
            expect(delays[i]).toBeLessThan(60_000 * 2 ** i + 30_000)
        }
    })

    it('doubles the delay also when it is shorter than the time it takes to fail the source', async () => {
        // With the default 180 s limit the primary serves for more than 3 minutes before it fails,
        // longer than the 60 s it was kept away. Time spent behind the tip is not good service.
        let r = await follow({reclaimBackoffMs: 60_000, cooldownMs: 1000}, HOUR)

        let failedAt = r.switches.filter((s) => s.to === 1).map((s) => s.at)
        let reclaimedAt = r.switches.filter((s) => s.to === 0).map((s) => s.at)
        let delays = reclaimedAt.map((at, i) => at - failedAt[i])
        expect(delays.length).toBeGreaterThanOrEqual(3)
        for (let i = 0; i < 3; i++) {
            expect(delays[i]).toBeGreaterThanOrEqual(60_000 * 2 ** i)
            expect(delays[i]).toBeLessThan(60_000 * 2 ** i + 30_000)
        }
    })

    it('starts from the base delay again after the source has kept up for as long as it was kept away', async () => {
        // Slow until t=100 s (fails once), fine until t=1000 s, slow again after. The second failure
        // comes after more than the 60 s delay of good service, so it is treated as a first one.
        let r = await follow(
            {reclaimBackoffMs: 60_000, maxStalenessMs: 20_000, cooldownMs: 1000},
            1_400_000,
            (now) => now >= 100_000 && now < 1_000_000,
        )

        let failedAt = r.switches.filter((s) => s.to === 1).map((s) => s.at)
        let reclaimedAt = r.switches.filter((s) => s.to === 0).map((s) => s.at)
        expect(failedAt.length).toBeGreaterThanOrEqual(2)
        expect(failedAt[1]).toBeGreaterThan(1_000_000)
        expect(reclaimedAt[1] - failedAt[1]).toBeLessThan(60_000 + 30_000) // not doubled
    })

    it('does not count time without a reference as good service', async () => {
        // The primary fails, then the second source goes down for 6 minutes, so the primary is used
        // again with nothing to compare it against. Those minutes are longer than the 60 s delay, but
        // they say nothing about whether the primary keeps up: once the second source is back, the
        // primary fails again, and that is a repeat failure with a doubled delay.
        let r = await follow(
            {reclaimBackoffMs: 60_000, maxStalenessMs: 20_000, cooldownMs: 1000},
            900_000,
            () => false,
            (now) => now >= 50_000 && now < 410_000,
        )

        let failedAt = r.switches.filter((s) => s.to === 1).map((s) => s.at)
        expect(failedAt[0]).toBeLessThan(50_000) // failed over before the outage
        expect(failedAt[1]).toBeGreaterThan(410_000) // failed again after it
        let reclaimed = r.switches.find((s) => s.to === 0 && s.at > failedAt[1])!
        expect(reclaimed.at - failedAt[1]).toBeGreaterThanOrEqual(120_000) // doubled, not reset to 60 s
    })

    it('adds up good service across streams', async () => {
        // The primary is slow until t=100 s (fails once, kept away for 60 s), keeps up until t=400 s
        // and is slow again after. While it keeps up, the consumer opens a new stream every 30 s, as
        // the batch processor does after a chain reorganisation. None of those streams lasts as long
        // as the delay, but together they are several minutes of good service: the second failure
        // is a first one again.
        let now = 0
        let tip = () => 100 + Math.floor(now / 1000)
        let claim = async () => ({number: tip(), hash: '0x'})
        let upToTip = (from: number) => {
            let blocks: TestBlock[] = []
            for (let n = from; n <= tip(); n++) blocks.push(blk(n))
            return blocks
        }
        let keepsUp = () => now >= 100_000 && now < 400_000
        let s0 = new MockSource(
            async function* (req) {
                let next = req.from
                while (true) {
                    if (keepsUp()) {
                        now += 1000
                        let blocks = upToTip(next)
                        next += blocks.length
                        yield batch(blocks)
                    } else {
                        now += 5000
                        yield batch(next <= tip() ? [blk(next++)] : [])
                    }
                }
            },
            {head: claim},
        )
        let s1 = new MockSource(
            async function* (req) {
                let next = req.from
                while (true) {
                    now += 1000
                    let blocks = upToTip(next)
                    next += blocks.length
                    yield batch(blocks)
                }
            },
            {head: claim},
        )
        let fb = fallback([s0, s1], {
            clock: () => now,
            reclaimBackoffMs: 60_000,
            maxStalenessMs: 20_000,
            cooldownMs: 1000,
        })

        let last = 99
        let prev: number | undefined
        let failedAt: number[] = []
        let reclaimedAt: number[] = []
        while (now < 700_000) {
            let startedAt = now
            for await (let b of fb.getStream({from: last + 1})) {
                let active = fb.activeIndex!
                if (prev === 0 && active === 1) failedAt.push(now)
                if (prev === 1 && active === 0) reclaimedAt.push(now)
                prev = active
                if (b.blocks.length) last = b.blocks[b.blocks.length - 1].header.number
                if (now >= 700_000) break
                if (now - startedAt >= 30_000 && keepsUp()) break
            }
        }

        expect(failedAt[0]).toBeLessThan(100_000)
        expect(failedAt[1]).toBeGreaterThan(400_000)
        expect(reclaimedAt[1] - failedAt[1]).toBeGreaterThanOrEqual(60_000)
        expect(reclaimedAt[1] - failedAt[1]).toBeLessThan(100_000) // the base delay, not a doubled one
    })

    it('takes it back right after the cooldown with reclaimBackoffMs: 0', async () => {
        let r = await follow({reclaimBackoffMs: 0, maxStalenessMs: 20_000, cooldownMs: 1000}, 600_000)

        let failedAt = r.switches.filter((s) => s.to === 1).map((s) => s.at)
        let reclaimedAt = r.switches.filter((s) => s.to === 0).map((s) => s.at)
        expect(reclaimedAt.length).toBeGreaterThanOrEqual(3)
        expect(reclaimedAt[0] - failedAt[0]).toBeLessThan(30_000)
    })

    it('does not start a new stream on it while another source is available', async () => {
        // The batch processor opens a new stream after every chain reorganisation. Selection for a
        // new stream prefers the first eligible source, which would be the primary again as soon as
        // its cooldown ends, for another three minutes of falling behind each time.
        let now = 0
        let tip = () => 100 + Math.floor(now / 1000)
        let claim = async () => ({number: tip(), hash: '0x'})
        let s0 = new MockSource(
            async function* (req) {
                let next = req.from
                while (true) {
                    now += 5000
                    yield batch(next <= tip() ? [blk(next++)] : [])
                }
            },
            {head: claim},
        )
        let s1 = new MockSource(
            async function* (req) {
                let next = req.from
                while (true) {
                    now += 1000
                    let blocks: TestBlock[] = []
                    while (next <= tip()) blocks.push(blk(next++))
                    yield batch(blocks)
                }
            },
            {head: claim},
        )
        let fb = fallback([s0, s1], {clock: () => now, maxStalenessMs: 20_000, cooldownMs: 1000})

        let last = 99
        for await (let b of fb.getStream({from: 100})) {
            if (b.blocks.length) last = b.blocks[b.blocks.length - 1].header.number
            if (fb.activeIndex === 1 && b.blocks.length) break
        }
        expect(fb.activeIndex).toBe(1)
        let primaryStreams = s0.calls.length

        now += 10_000 // the primary's cooldown is long over
        for await (let b of fb.getStream({from: last + 1})) {
            if (b.blocks.length) break
        }
        expect(fb.activeIndex).toBe(1)
        expect(s0.calls).toHaveLength(primaryStreams)
    })

    it('still passes it over when a failover sweep starts again', async () => {
        // A is failed for not delivering. B fails at once, and C fails after a two-second timeout
        // without delivering anything. By then A's and B's cooldowns are over and every source has
        // been tried, so the sweep starts again: it has to go to B, not back to A.
        let now = 0
        let tip = () => 100 + Math.floor(now / 1000)
        let claim = async () => ({number: tip(), hash: '0x'})
        let upToTip = (from: number) => {
            let blocks: TestBlock[] = []
            for (let n = from; n <= tip(); n++) blocks.push(blk(n))
            return blocks
        }
        let a = new MockSource(
            async function* (req) {
                let next = req.from
                while (true) {
                    now += 5000
                    yield batch(next <= tip() ? [blk(next++)] : [])
                }
            },
            {head: claim},
        )
        let b = new MockSource(
            async function* (req, call) {
                if (call === 0) throw new Error('b is down')
                let next = req.from
                while (true) {
                    now += 1000
                    let blocks = upToTip(next)
                    next += blocks.length
                    yield batch(blocks)
                }
            },
            {head: claim},
        )
        let c = new MockSource(
            async function* (req) {
                now += 2000
                if (req.from >= 0) throw new Error('c timed out')
                yield batch([])
            },
            {head: claim},
        )
        let fb = fallback([a, b, c], {
            clock: () => now,
            maxStalenessMs: 20_000,
            cooldownMs: 1000,
            preferPrimary: 'onFailureOnly',
        })

        for await (let batch of fb.getStream({from: 100})) {
            if (c.calls.length > 0 && batch.blocks.length) break
        }
        expect(c.calls).toHaveLength(1)
        expect(fb.activeIndex).toBe(1)
        expect(a.calls).toHaveLength(1)
        expect(b.calls).toHaveLength(2)
    })

    it('still uses it when the other source fails', async () => {
        // The delay only applies to eager switch-up. A stream error on the second source right after
        // the failover leaves nothing else, so the primary is selected again.
        let now = 0
        let tip = () => 100 + Math.floor(now / 1000)
        let claim = async () => ({number: tip(), hash: '0x'})
        let s0 = new MockSource(
            async function* (req) {
                for (let next = req.from; next <= req.to!; next++) {
                    now += 5000
                    yield batch([blk(next)])
                }
            },
            {head: claim},
        )
        let s1 = new MockSource(
            async function* (req) {
                now += 2000 // by now the primary's cooldown is over
                if (req.from >= 0) throw new Error('down')
                yield batch([])
            },
            {head: claim},
        )
        let fb = fallback([s0, s1], {clock: () => now, maxStalenessMs: 20_000, cooldownMs: 1000})

        let got = numbers(await collect(fb.getStream({from: 100, to: 115})))
        expect(got[got.length - 1]).toBe(115)
        expect(s0.calls.length).toBeGreaterThanOrEqual(2) // served, failed over, selected again
        expect(s1.calls.length).toBeGreaterThanOrEqual(1)
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

    it.each(['getHead', 'getFinalizedHead'] as const)(
        '%s times out an active RPC endpoint that accepts a connection but never responds',
        async (method) => {
            let noop: StreamFn = async function* () {}
            let s0 = new MockSource(noop, {
                // The RPC connection is accepted, but the endpoint never sends a response.
                head: () => new Promise<BlockRef>(() => {}),
            })
            let s1 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
            let fb = fallback([s0, s1], {activeHeadTimeoutMs: 20, livenessFailThreshold: 1})

            expect(await fb[method]()).toEqual({number: 7, hash: '0x7'})
            expect(fb.metrics().sources[0].cause).toMatchObject({check: 'liveness', reason: 'timeout'})
        },
        1000,
    )

    it('fails a hung active head over only after livenessFailThreshold consecutive timeouts', async () => {
        let noop: StreamFn = async function* () {}
        let s0calls = 0
        let s0 = new MockSource(noop, {
            head: () => {
                s0calls++
                return new Promise<BlockRef>(() => {})
            },
        })
        let s1 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
        let fb = fallback([s0, s1], {activeHeadTimeoutMs: 20, livenessFailThreshold: 2})

        expect(await fb.getHead()).toEqual({number: 7, hash: '0x7'})
        // The first timeout is retried on the same source (a blip); the second condemns it.
        expect(s0calls).toBe(2)
        expect(fb.metrics().sources[0]).toMatchObject({
            health: 'unhealthy',
            cause: {check: 'liveness', reason: 'timeout'},
        })
    }, 1000)

    it('a single active-head timeout followed by a response does not fail the source over', async () => {
        let noop: StreamFn = async function* () {}
        let s0calls = 0
        let s0 = new MockSource(noop, {
            head: () => (s0calls++ === 0 ? new Promise<BlockRef>(() => {}) : Promise.resolve({number: 5, hash: '0x5'})),
        })
        let s1 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
        let fb = fallback([s0, s1], {activeHeadTimeoutMs: 20, livenessFailThreshold: 2})

        expect(await fb.getHead()).toEqual({number: 5, hash: '0x5'})
        expect(fb.metrics().sources[0].health).not.toBe('unhealthy')
    }, 1000)

    // The active source's head request queues behind its own batch requests, so it may legitimately
    // take far longer than an idle standby's poll. The standby bound must not apply to it.
    it('a slow-but-alive active head is not bound by the standby headPollTimeoutMs', async () => {
        let noop: StreamFn = async function* () {}
        let s0 = new MockSource(noop, {
            head: () => new Promise<BlockRef>((resolve) => setTimeout(() => resolve({number: 5, hash: '0x5'}), 100)),
        })
        let s1 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
        let fb = fallback([s0, s1], {headPollTimeoutMs: 20, livenessFailThreshold: 1})

        expect(await fb.getHead()).toEqual({number: 5, hash: '0x5'})
        expect(await fb.getFinalizedHead()).toEqual({number: 5, hash: '0x5'})
        expect(fb.metrics().sources[0].health).not.toBe('unhealthy')
    }, 2000)

    // Copilot finding on #620: when a timeout lasts at least `cooldownMs`, the first condemned source
    // cools down while the second is still timing out, and selection restarted at index 0, so
    // A and B alternated forever and the healthy C was never tried.
    it('reaches a healthy third source past two hung ones even when the timeout outlasts the cooldown', async () => {
        let noop: StreamFn = async function* () {}
        let calls = [0, 0]
        let hang = (i: number) => () => {
            calls[i]++
            return new Promise<BlockRef>(() => {})
        }
        let s0 = new MockSource(noop, {head: hang(0)})
        let s1 = new MockSource(noop, {head: hang(1)})
        let s2 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
        let fb = fallback([s0, s1, s2], {activeHeadTimeoutMs: 30, cooldownMs: 10, livenessFailThreshold: 2})

        expect(await fb.getHead()).toEqual({number: 7, hash: '0x7'})
        expect(calls).toEqual([2, 2])
    }, 2000)

    it('activeHeadTimeoutMs: null disables the active-head guard', async () => {
        let noop: StreamFn = async function* () {}
        let s0 = new MockSource(noop, {head: () => new Promise<BlockRef>(() => {})})
        let s1 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
        let fb = fallback([s0, s1], {activeHeadTimeoutMs: null, livenessFailThreshold: 1})

        let pending = Symbol('pending')
        let winner = await Promise.race([fb.getHead(), new Promise((r) => setTimeout(() => r(pending), 100))])
        expect(winner).toBe(pending)
    }, 1000)

    it('treats a head-fetch failure as liveness (a single blip does not condemn the source)', async () => {
        let noop: StreamFn = async function* () {}
        let calls = 0
        // Fails the first head fetch, then recovers — a transient blip below the liveness threshold.
        let s0 = new MockSource(noop, {
            head: async () => {
                if (++calls === 1) throw new Error('blip')
                return {number: 5, hash: '0x5'}
            },
        })
        let s1 = new MockSource(noop, {head: async () => ({number: 7, hash: '0x7'})})
        let fb = fallback([s0, s1])

        // Retried on s0 (still eligible below the threshold) rather than failed over to s1...
        expect(await fb.getHead()).toEqual({number: 5, hash: '0x5'})
        // ...and the blip left s0 usable for streaming, not unhealthy + in cooldown.
        expect(fb.health[0].state).not.toBe('unhealthy')
    })

    it('records a liveness pass on a successful head query, so non-consecutive blips do not condemn it', async () => {
        let noop: StreamFn = async function* () {}
        let seq = [
            () => {
                throw new Error('blip')
            },
            () => ({number: 5, hash: '0x5'}),
            () => {
                throw new Error('blip')
            },
            () => ({number: 6, hash: '0x6'}),
        ]
        let k = 0
        let s0 = new MockSource(noop, {head: async () => seq[Math.min(k++, seq.length - 1)]()})
        let s1 = new MockSource(noop, {head: async () => ({number: 99, hash: '0x99'})})
        let fb = fallback([s0, s1], {livenessFailThreshold: 2, cooldownMs: 60_000})

        expect(await fb.getHead()).toEqual({number: 5, hash: '0x5'}) // blip, then success on s0
        // The success must reset s0's consecutive-liveness-fail counter, so the later blip counts as
        // #1 again (not #2) — s0 stays eligible and serves the next head instead of being condemned
        // and forcing a failover to s1. Pre-fix (no pass recorded) the second blip trips the threshold.
        expect(await fb.getHead()).toEqual({number: 6, hash: '0x6'})
        expect(fb.health[0].state).not.toBe('unhealthy')
    })

    it('throws AllSourcesDown after the timeout when every source fails its head fetch', async () => {
        let noop: StreamFn = async function* () {}
        let down = () => {
            throw new Error('down')
        }
        let s0 = new MockSource(noop, {head: down})
        let s1 = new MockSource(noop, {head: down})
        // livenessFailThreshold 1 → the first head failure condemns each source, so after both fail
        // nothing is eligible and delegateHead hits the shared all-down path (via selectActive).
        let fb = fallback([s0, s1], {
            allDownTimeoutMs: 0,
            allDownPollMs: 1,
            livenessFailThreshold: 1,
            cooldownMs: 60_000,
        })

        await expect(fb.getHead()).rejects.toThrowError(/all fallback data sources/)
    })
})

describe('FallbackDataSource — metrics', () => {
    it('reports the active source, switch count, and per-source health', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)])
            throw new Error('boom')
        })
        let s1 = new MockSource(async function* () {
            yield batch([blk(2)])
        })
        let fb = fallback([s0, s1])

        await collect(fb.getStream({from: 1, to: 2}))
        let m = fb.metrics()

        expect(m.activeIndex).toBe(1)
        expect(m.switchCount).toBe(1)
        expect(m.sources).toMatchObject([
            {name: 's0', health: 'unhealthy', active: false},
            {name: 's1', health: 'unknown', active: true},
        ])
        // The unhealthy source carries its classified cause; the healthy/unknown one does not.
        expect(m.sources[0].cause).toMatchObject({check: 'stream', reason: 'unknown'})
        expect(m.sources[0].cause?.detail).toContain('boom')
        expect(m.sources[1].cause).toBeUndefined()
    })
})

describe('FallbackDataSource — head-poll timeout (robustness)', () => {
    // A hanging head never resolves — models a sick standby: TCP up, no response.
    const hangHead = () => new Promise<BlockRef>(() => {})

    it('a sick standby whose getHead hangs does not stall the healthy active source', async () => {
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2)])
            yield batch([blk(3)])
        })
        // Its head poll hangs; without the timeout, the per-batch lag check would block s0 forever.
        let s1 = new MockSource(async function* () {}, {head: hangHead})
        let fb = fallback([s0, s1], {
            maxLagBlocks: 10,
            maxStalenessMs: null,
            headTtlMs: 0,
            headPollTimeoutMs: 20,
            livenessFailThreshold: 1, // one timed-out poll condemns the sick standby
            cooldownMs: 60_000,
        })

        expect(numbers(await collect(fb.getStream({from: 1, to: 3})))).toEqual([1, 2, 3])
        expect(fb.activeIndex).toBe(0) // the healthy primary streamed to completion, never blocked
        let s1health = fb.metrics().sources[1]
        expect(s1health.health).toBe('unhealthy')
        expect(s1health.cause).toMatchObject({check: 'liveness', reason: 'timeout'})
    }, 5000)
})

describe('FallbackDataSource — active capability confirmation', () => {
    it('reaches healthy by serving batches, without the standby capability probe ever running', async () => {
        let probed = 0
        let s0 = new MockSource(async function* () {
            yield batch([blk(1)])
            yield batch([blk(2)])
            yield batch([blk(3)])
            yield batch([blk(4)])
        })
        let fb = new FallbackDataSource<TestBlock>({
            sources: [{name: 's0', source: s0, probeCapability: async () => (probed++, {ok: true})}],
            getBlockRef: (b) => ({number: b.header.number, hash: b.header.hash}),
            policy: {livenessRecoverThreshold: 3, maxLagBlocks: null, maxStalenessMs: null},
        })

        expect(numbers(await collect(fb.getStream({from: 1, to: 4})))).toEqual([1, 2, 3, 4])
        // The active source proved capability by actually serving the query — the standby probe (a
        // separate slice) never ran for it, yet it still left `unknown` for `healthy`.
        expect(probed).toBe(0)
        expect(fb.metrics().sources[0].health).toBe('healthy')
    })
})
