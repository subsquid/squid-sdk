import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest, isForkException} from '@subsquid/util-internal-data-source'
import {FiniteRange} from '@subsquid/util-internal-range'

import {SourceHealth} from './health'
import {AllSourcesDownError, FallbackPolicy, ResolvedPolicy, resolvePolicy} from './policy'
import {Selector} from './selector'

/** Returned by the staleness-aware fetch when the active source must be failed over. */
const STALE = Symbol('stale')

export interface RankedSource<B> {
    name: string
    source: DataSource<B>
    /** Full, infrequent capability probe — verifies the source can still serve the query's data. */
    probeCapability?: () => Promise<boolean>
}

export interface FallbackDataSourceOptions<B> {
    sources: RankedSource<B>[]
    /** Extracts a source's chain position from a yielded block (for resume after a switch). */
    getBlockRef: (block: B) => BlockRef
    policy?: FallbackPolicy
}

/**
 * A meta `DataSource<B>` built from an ordered list of sources. It drives the lowest-index
 * *healthy* (or, optimistically at startup, `unknown`) source; on a non-fork stream error it
 * marks that source unhealthy and resumes the *next* source from the last committed position.
 * Because position is a `{number, hash}` pair and the sources are stateless, a fork straddling a
 * switch is just an ordinary reorg: `ForkException` is propagated untouched and the consumer's
 * existing rollback machinery handles it (plan §3). `finalizedHead` is passed through unchanged —
 * the finalized high-watermark is the stateful target's job, not this stateless source's.
 */
export class FallbackDataSource<B> implements DataSource<B> {
    private sources: RankedSource<B>[]
    private getBlockRef: (block: B) => BlockRef
    readonly policy: ResolvedPolicy
    readonly health: SourceHealth[]
    private selector: Selector

    /** Observable state (for metrics, §4). */
    activeIndex: number | undefined
    switchCount = 0
    /** Freshness metrics (§4 / M1): blocks behind the independent head, and source-pending ms. */
    lag = 0
    staleness = 0
    chainHead: number | undefined
    /** Set when every source is stuck at the same head (no fresher alternative to switch to). */
    chainStalled = false

    #lagArmed = false
    #headCache: ({value: number | undefined; at: number} | undefined)[] = []

    constructor(options: FallbackDataSourceOptions<B>) {
        if (options.sources.length === 0) {
            throw new Error('FallbackDataSource requires at least one source')
        }
        this.sources = options.sources
        this.getBlockRef = options.getBlockRef
        this.policy = resolvePolicy(options.policy)
        this.health = this.sources.map((s) => new SourceHealth(this.policy, !!s.probeCapability))
        this.selector = new Selector(this.health)
    }

    getStream(req: StreamRequest): BlockStream<B> {
        return this.runStream(req, false)
    }

    getFinalizedStream(req: StreamRequest): BlockStream<B> {
        return this.runStream(req, true)
    }

    private async *runStream(req: StreamRequest, finalized: boolean): BlockStream<B> {
        let lastNumber = req.from - 1
        let lastHash = req.parentHash
        let allDownSince: number | undefined

        while (true) {
            let active = this.selector.pickForFailover()
            if (active == null) {
                if (await this.waitAllDown(allDownSince ?? (allDownSince = this.policy.clock()))) continue
                throw new AllSourcesDownError()
            }
            allDownSince = undefined
            this.setActive(active)

            let streamReq: StreamRequest = {from: lastNumber + 1, to: req.to, parentHash: lastHash}
            let src = this.sources[active].source

            try {
                let iterator = (finalized ? src.getFinalizedStream(streamReq) : src.getStream(streamReq))[
                    Symbol.asyncIterator
                ]()
                try {
                    while (true) {
                        let next = await this.nextWithStaleness(iterator, active, lastNumber)
                        if (next === STALE) {
                            // Source stopped delivering while a fresher source is ahead.
                            this.health[active].onStreamError()
                            break
                        }
                        if (next.done) return // bounded stream finished
                        let batch = next.value

                        this.health[active].onBatch()
                        yield batch

                        if (batch.blocks.length) {
                            let ref = this.getBlockRef(batch.blocks[batch.blocks.length - 1])
                            lastNumber = ref.number
                            lastHash = ref.hash
                        }

                        // Lag-based freshness: the active fell too far behind the independent head.
                        if (await this.laggingTooFar(active, lastNumber)) {
                            this.health[active].onStreamError()
                            break
                        }

                        // Eager switch-up: reclaim a recovered higher-preference source at the
                        // batch boundary (never mid-batch).
                        if (this.policy.preferPrimary === 'eager' && this.selector.pickSwitchUp(active) != null) {
                            break
                        }
                    }
                } finally {
                    // Fire-and-forget: a *stalled* source's `return()` can itself hang on the
                    // same unresolved fetch, and failover must not wait on it.
                    safeReturn(iterator)
                }
            } catch (e) {
                if (isForkException(e)) throw e // propagate; do NOT switch (§3.4)
                this.health[active].onStreamError()
                // re-select and resume from lastCommitted on the next iteration
            }
        }
    }

    async getHead(): Promise<BlockRef> {
        return this.delegateHead((s) => s.getHead())
    }

    async getFinalizedHead(): Promise<BlockRef> {
        return this.delegateHead((s) => s.getFinalizedHead())
    }

    private async delegateHead(get: (s: DataSource<B>) => Promise<BlockRef>): Promise<BlockRef> {
        let allDownSince: number | undefined

        while (true) {
            let active = this.selector.pickForFailover()
            if (active == null) {
                if (await this.waitAllDown(allDownSince ?? (allDownSince = this.policy.clock()))) continue
                throw new AllSourcesDownError()
            }
            allDownSince = undefined

            try {
                return await get(this.sources[active].source)
            } catch {
                this.health[active].onStreamError()
            }
        }
    }

    getBlocksCountInRange(range: FiniteRange): number {
        for (let s of this.sources) {
            if (s.source.getBlocksCountInRange) return s.source.getBlocksCountInRange(range)
        }

        return 0
    }

    /** Returns true if it waited (should retry), false if the all-down timeout elapsed. */
    private async waitAllDown(since: number): Promise<boolean> {
        if (this.policy.allDownTimeoutMs != null && this.policy.clock() - since >= this.policy.allDownTimeoutMs) {
            return false
        }
        await sleep(this.policy.allDownPollMs)

        return true
    }

    /**
     * The highest head reported by the *other* eligible sources — an independent reference that
     * avoids the circular-lag trap (a source that stalls head and data together reads lag ≈ 0
     * against its own head). Excludes `unhealthy` sources so a flagged-bad one can't define the
     * tip. Heads are cached for `headTtlMs` to bound the probe rate.
     */
    private async chainHeadOthers(active: number): Promise<number | undefined> {
        let results = await Promise.all(
            this.sources.map((_, i) =>
                i === active || this.health[i].state === 'unhealthy'
                    ? Promise.resolve(undefined)
                    : this.getCachedHead(i),
            ),
        )
        let vals = results.filter((h): h is number => h != null)

        return vals.length ? Math.max(...vals) : undefined
    }

    private async getCachedHead(i: number): Promise<number | undefined> {
        let now = this.policy.clock()
        let cached = this.#headCache[i]
        if (cached && now - cached.at < this.policy.headTtlMs) return cached.value

        try {
            let head = await this.sources[i].source.getHead()
            this.#headCache[i] = {value: head.number, at: now}
            return head.number
        } catch {
            this.#headCache[i] = {value: undefined, at: now}
            this.health[i].onLivenessFail()
            return undefined
        }
    }

    /** Boundary-evaluated lag trigger (armed only once the tip is first reached). */
    private async laggingTooFar(active: number, lastNumber: number): Promise<boolean> {
        if (this.policy.maxLagBlocks == null) return false

        let others = await this.chainHeadOthers(active)
        this.chainHead = others != null ? Math.max(others, lastNumber) : lastNumber
        if (others == null) return false

        let lag = others - lastNumber
        this.lag = Math.max(0, lag)
        if (lag <= this.policy.maxLagBlocks) this.#lagArmed = true // arm at tip (latched)

        if (this.#lagArmed && lag > this.policy.maxLagBlocks) {
            // A fresher alternative exists by construction (others > lastNumber + maxLagBlocks).
            this.chainStalled = false
            return true
        }

        return false
    }

    /**
     * `iterator.next()` with the source-pending staleness clock. While the request is
     * outstanding (and only then — never while parked at `yield`), a ticker checks how long it
     * has been pending; past `maxStalenessMs` it fails the source over **iff** a fresher source
     * is ahead. If every source sits at the same stale head, it is a global chain stall: hold the
     * source and flag `chainStalled` instead of churning (unless `churnOnGlobalStall`).
     */
    private async nextWithStaleness(
        iterator: AsyncIterator<BlockBatch<B>>,
        active: number,
        lastNumber: number,
    ): Promise<IteratorResult<BlockBatch<B>> | typeof STALE> {
        if (this.policy.maxStalenessMs == null) {
            this.staleness = 0
            return iterator.next()
        }

        let start = this.policy.clock()
        let nextP = iterator.next()
        nextP.catch(() => {}) // a later abandon must not surface as an unhandled rejection
        let settled = nextP.then(
            (v) => ({type: 'next' as const, v}),
            (e) => ({type: 'error' as const, e}),
        )

        while (true) {
            let tick = delay(this.policy.freshnessTickMs)
            let r = await Promise.race([settled, tick.promise.then(() => ({type: 'tick' as const}))])
            tick.cancel()

            if (r.type === 'next') {
                this.staleness = 0
                return r.v
            }
            if (r.type === 'error') {
                this.staleness = 0
                throw r.e
            }

            let elapsed = this.policy.clock() - start
            this.staleness = elapsed
            if (elapsed > this.policy.maxStalenessMs) {
                let others = await this.chainHeadOthers(active)
                if (others != null && others > lastNumber) {
                    this.chainStalled = false
                    return STALE
                }
                this.chainStalled = true
                if (this.policy.churnOnGlobalStall) return STALE
                start = this.policy.clock() // hold; re-arm and keep waiting
            }
        }
    }

    private setActive(i: number): void {
        if (this.activeIndex !== i) {
            if (this.activeIndex !== undefined) this.switchCount++
            this.activeIndex = i
        }
    }
}

function delay(ms: number): {promise: Promise<void>; cancel: () => void} {
    let timer: ReturnType<typeof setTimeout>
    let promise = new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms)
    })

    return {promise, cancel: () => clearTimeout(timer)}
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeReturn(it: AsyncIterator<unknown>): void {
    try {
        // Don't await: closing the old connection must neither block failover nor surface a
        // late rejection.
        it.return?.()?.then(
            () => {},
            () => {},
        )
    } catch {
        /* ignore */
    }
}
