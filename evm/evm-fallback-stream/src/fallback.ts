import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest, isForkException} from '@subsquid/util-internal-data-source'
import {FiniteRange} from '@subsquid/util-internal-range'

import {SourceHealth} from './health'
import {AllSourcesDownError, FallbackPolicy, Health, ResolvedPolicy, resolvePolicy} from './policy'
import {Selector} from './selector'

/** Returned by the staleness-aware fetch when the active source must be failed over. */
const STALE = Symbol('stale')

/** A structured snapshot of the fallback's observable state, for a metrics surface (§4). */
export interface FallbackMetrics {
    activeIndex: number | undefined
    switchCount: number
    lag: number
    staleness: number
    chainStalled: boolean
    chainHead: number | undefined
    sources: {name: string; health: Health; active: boolean}[]
}

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
    /** Guards against firing a second capability probe for a source while one is still in flight. */
    #capabilityProbing: boolean[] = []
    /** Last source we drove, retained across an all-down gap so switch-counting stays correct. */
    #lastActive: number | undefined

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
                this.clearActive()
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
                        // batch boundary (never mid-batch). Probe those candidates first so their
                        // liveness/capability can recover them to `healthy` even when the freshness
                        // head-polls are disabled — switch-up must not depend on that machinery.
                        if (this.policy.preferPrimary === 'eager') {
                            await this.probeHigherPreference(active)
                            if (this.selector.pickSwitchUp(active) != null) break
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
                this.clearActive()
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

    /** Snapshot of the observable state for export to a metrics surface (§4). */
    metrics(): FallbackMetrics {
        return {
            activeIndex: this.activeIndex,
            switchCount: this.switchCount,
            lag: this.lag,
            staleness: this.staleness,
            chainStalled: this.chainStalled,
            chainHead: this.chainHead,
            sources: this.sources.map((s, i) => ({
                name: s.name,
                health: this.health[i].state,
                active: this.activeIndex === i,
            })),
        }
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
            // The head fetch doubles as the liveness probe (§4): a fresh head is proof the source
            // is reachable, so it counts toward the `M` passes that promote a standby to `healthy`
            // — without which it could never be eligible for eager switch-up. A reachable source
            // is also when we (re)confirm its capability.
            this.health[i].onLivenessPass()
            this.#maybeProbeCapability(i)
            return head.number
        } catch {
            this.#headCache[i] = {value: undefined, at: now}
            this.health[i].onLivenessFail()
            return undefined
        }
    }

    /**
     * Drive liveness/capability for the not-yet-active *higher-preference* sources, so a recovered
     * one can reach `healthy` and be reclaimed by eager switch-up. When the active source is the
     * primary (index 0) there are none, so this is a no-op on the hot path; it only does work after
     * a failover, which is exactly when a recovered primary needs to be noticed.
     */
    private async probeHigherPreference(active: number): Promise<void> {
        await Promise.all(
            this.sources.map((_, i) =>
                i < active && this.health[i].state !== 'unhealthy'
                    ? this.getCachedHead(i)
                    : Promise.resolve(undefined),
            ),
        )
    }

    /**
     * Fire a source's optional capability probe once it is proven reachable, feeding the result
     * into its health (§4). A source that declares a `probeCapability` cannot become `healthy` on
     * liveness alone — capability must be confirmed — so without this it could never be switched up
     * to. Fire-and-forget (a full capability slice must not block the boundary), and never
     * concurrently for the same source. Periodic re-verification, to catch a source that *loses*
     * capability after confirmation, is a future refinement.
     */
    #maybeProbeCapability(i: number): void {
        let probe = this.sources[i].probeCapability
        if (!probe || this.health[i].capabilityConfirmed || this.#capabilityProbing[i]) return

        this.#capabilityProbing[i] = true
        probe()
            .then(
                (ok) => this.health[i].onCapability(ok),
                () => this.health[i].onCapability(false),
            )
            .finally(() => {
                this.#capabilityProbing[i] = false
            })
    }

    /** Boundary-evaluated lag trigger (armed only once the tip is first reached). */
    private async laggingTooFar(active: number, lastNumber: number): Promise<boolean> {
        if (this.policy.maxLagBlocks == null) return false

        let others = await this.chainHeadOthers(active)
        this.chainHead = others != null ? Math.max(others, lastNumber) : lastNumber
        if (others == null) {
            this.lag = 0 // no independent reference ⇒ lag is not computable; don't report a stale value
            return false
        }

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
                this.chainStalled = false // progress resumed — clear any prior global-stall flag
                return r.v
            }
            if (r.type === 'error') {
                this.staleness = 0
                this.chainStalled = false // moving off this source — the stall flag must not persist
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
        // Count a switch against the last source we drove (not `activeIndex`, which is cleared to
        // `undefined` during an all-down gap) so resuming on a *different* source after the gap
        // still registers, and resuming on the *same* one does not.
        if (this.#lastActive !== undefined && this.#lastActive !== i) this.switchCount++
        this.#lastActive = i
        this.activeIndex = i
    }

    /** No source is eligible (all unhealthy): nothing is being driven, so report no active source. */
    private clearActive(): void {
        this.activeIndex = undefined
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
