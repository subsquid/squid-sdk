import {BlockBatch, BlockRef, BlockStream, DataSource, ForkException, StreamRequest} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'

import {LogLevel, setLogLevelCallback} from '@subsquid/logger'

import {FallbackDataSource, RankedSource} from './fallback'
import {FallbackPolicy} from './policy'

// The supervisor logs its (static) cause logger at WARN; raise the floor to ERROR for the
// `sqd:evm-fallback-stream` namespace so the expected unhealthy transitions don't spam test output.
setLogLevelCallback((ns) => (ns.startsWith('sqd:evm-fallback') ? LogLevel.ERROR : undefined))

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
        let s0 = new MockSource(async function* () {
            yield batch([blk(90)])
            yield batch([blk(91)])
        })
        // Empty standby: after failover the stream ends immediately, so no boundary recomputes
        // freshness — exposing whether the switch itself cleared the old source's lag.
        let s1 = new MockSource(async function* () {}, {head: async () => ({number: s1heads.shift() ?? 110, hash: '0x'})})
        let fb = fallback([s0, s1], {maxLagBlocks: 10, maxStalenessMs: null, headTtlMs: 0, cooldownMs: 60_000})

        expect(numbers(await collect(fb.getStream({from: 90, to: 93})))).toEqual([90, 91])
        expect(fb.activeIndex).toBe(1)
        expect(fb.lag).toBe(0) // not the stale 19 the lag trigger recorded against s0
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
