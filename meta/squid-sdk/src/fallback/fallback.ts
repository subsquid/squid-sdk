import {Logger, createLogger} from '@subsquid/logger'
import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest, isForkException} from '@subsquid/util-internal-data-source'
import type {MetricsSink} from '@subsquid/util-internal-processor-tools'
import {FiniteRange} from '@subsquid/util-internal-range'

import {safeReturn, withTimeout} from './async'
import {ProbeResult} from './capability'
import {SourceErrorInfo, capabilityFailure, classifyError, freshnessFailure} from './diagnostics'
import {SourceHealth} from './health'
import {fallbackMetricsSink} from './metrics'
import {AllSourcesDownError, FallbackPolicy, Health, ResolvedPolicy, resolvePolicy} from './policy'
import {Selector} from './selector'

/** Returned by the staleness-aware fetch when the active source must be failed over. */
const STALE = Symbol('stale')

/** The delay before a source failed for not delivering is taken back doubles up to this factor. */
const MAX_RECLAIM_BACKOFF_FACTOR = 16

/** Per-source record of failures for not delivering, see `FallbackPolicy.reclaimBackoffMs`. */
interface ReclaimBackoff {
    /** Such failures in a row, without a long enough spell of good service in between. */
    failures: number
    /** The delay applied after the last one. */
    delayMs: number
    /** Eager switch-up does not take the source back before this time. */
    notBefore: number
}

/** A structured snapshot of the fallback's observable state, for a metrics surface. */
export interface FallbackMetrics {
    activeIndex: number | undefined
    switchCount: number
    /** Delivery lag: the best height another source claims, minus the stream's served frontier. */
    lag: number
    /** Source lag: the best height another source claims, minus the height the active source claims. */
    sourceLag: number
    staleness: number
    chainStalled: boolean
    /** Best known chain height: the larger of the other sources' best claim and the served frontier. */
    chainHead: number | undefined
    sources: {
        name: string
        health: Health
        active: boolean
        cause?: SourceErrorInfo
        /** Highest block this source delivered on the current stream (verified by the data). */
        servedHeight?: number
        /** Height this source last claimed for the current stream kind (latest or finalized). */
        claimedHeight?: number
    }[]
}

/** Which of a source's claimed heights a stream is measured against. */
type HeightKind = 'latest' | 'finalized'

/** A polled claim: `height` is `undefined` when the poll failed. */
interface ClaimedHeight {
    height: number | undefined
    at: number
}

/**
 * The two heights the supervisor tracks per source, kept apart on purpose.
 *
 * - `served`: the highest block the source actually delivered on the current stream. It is
 *   verified by the data itself, and only the active source moves it.
 * - `claimed`: what the source says it can serve (`getHead()` / `getFinalizedHead()`, i.e. Portal
 *   `/head` and `/finalized-head`, RPC `eth_blockNumber` or the `finalized` tag). Informative but
 *   unverified: a source can claim blocks it then fails to deliver, or lag behind its own claim.
 */
interface SourceHeights {
    /** Last stream to deliver from this source wins: with overlapping streams it is a metric only. */
    served: number | undefined
    claimed: Record<HeightKind, ClaimedHeight | undefined>
}

/**
 * Per-stream state. A `FallbackDataSource` can drive overlapping streams (live ingestion next to
 * a finalized backfill), so nothing a stream resumes from or decides on lives on the instance.
 */
interface StreamState {
    /** Which claimed heights this stream is measured against: finalized ones on a finalized stream. */
    kind: HeightKind
    /**
     * The stream's served frontier: the last block it delivered, from whichever source (the resume
     * point `from - 1` before the first batch). Failover resumes after it.
     */
    frontier: number
    /** The lag trigger is armed once the frontier first gets within `maxLagBlocks` of the tip. */
    lagArmed: boolean
    /** On a finalized stream: when the source lag was first seen above `maxLagBlocks`. */
    lagExceededSince?: number
    /**
     * Delivery lag at the last batch boundary: the other sources' best claim minus the frontier.
     * `undefined` when there is no reference (or the lag trigger is disabled).
     */
    deliveryLag?: number
    /** Open while the stream stays more than `maxLagBlocks` behind, see {@link StarvationWindow}. */
    starvation?: StarvationWindow
}

/**
 * Accounting for a spell in which the stream stays more than `maxLagBlocks` behind the other
 * sources' best claim. It separates the two reasons a stream can be behind: the time it spent
 * waiting on the active source for the next batch, against the time the consumer held a batch.
 * Time the supervisor itself takes (head polls) counts for neither.
 */
interface StarvationWindow {
    /** When the window opened. */
    since: number
    /** Time spent waiting on the active source for a batch since then. */
    waitMs: number
    /** Time the consumer held the delivered batches since then (parked at `yield`). */
    consumerMs: number
    /** Blocks the source delivered since then. */
    blocks: number
    /** Delivery lag when the window opened, against claims polled at that moment. */
    startLag: number
}

export interface RankedSource<B> {
    name: string
    source: DataSource<B>
    /**
     * Full, infrequent capability probe — verifies the source can still serve the query's data.
     * `atBlock` is the block height the supervisor wants probed (near the current indexing
     * position, clamped off the chain tip); the probe should confirm the source can serve the
     * configured data *at that depth* and resolve not-`ok` (with a cause) if it cannot.
     */
    probeCapability?: (atBlock: number) => Promise<ProbeResult>
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
 * existing rollback machinery handles it. `finalizedHead` is passed through unchanged —
 * the finalized high-watermark is the stateful target's job, not this stateless source's.
 *
 * **Served vs claimed heights.** Every decision distinguishes what a source has *served* (blocks it
 * delivered, see {@link SourceHeights}) from what it *claims* (its head endpoints). The stream's
 * served `frontier` is the last block delivered from any source. Comparisons are like for like by
 * default: claims are compared with claims (is the active source itself behind?), served with
 * served. Where a claim is compared with the served frontier, the comment at that comparison says
 * why. In short:
 *
 * - lag failover: fires only when the active source's *claim* trails the other sources' best
 *   *claim* by more than `maxLagBlocks` (or the active is idle at its own claim). The served
 *   frontier only gates whether the check runs, so a consumer that is slower than a healthy
 *   source never fails it over;
 * - staleness: a stream that served nothing for `maxStalenessMs` while others claim blocks beyond
 *   the frontier fails over;
 * - starvation: a claim is unverified, so a source that claims the tip while the stream waits on
 *   it for `maxStalenessMs` without getting closer to the tip fails over too. Only served heights
 *   and the time spent waiting on the source decide this, see {@link starvedBySource}. Such a
 *   source still claims the tip, so eager switch-up stays away from it for `reclaimBackoffMs`;
 * - switch-up: a candidate must claim at least the frontier (minus `maxLagBlocks`);
 * - head delegation reports the *claim* of the source the stream is driving.
 */
export class FallbackDataSource<B> implements DataSource<B> {
    private sources: RankedSource<B>[]
    private getBlockRef: (block: B) => BlockRef
    readonly policy: ResolvedPolicy
    readonly health: SourceHealth[]
    private selector: Selector
    // Static, VM-agnostic namespace (`sqd:<component>`, like `sqd:evm-rpc`) — the supervisor is not
    // EVM-specific; the cause is also exported through `metrics()` for a metrics surface.
    private logger: Logger = createLogger('sqd:fallback')

    /** Observable state (for metrics). */
    activeIndex: number | undefined
    switchCount = 0
    /** Freshness metrics: see {@link FallbackMetrics} for `lag` vs `sourceLag`; source-pending ms. */
    lag = 0
    staleness = 0
    chainHead: number | undefined
    /** Set when every source is stuck at the same head (no fresher alternative to switch to). */
    chainStalled = false

    /** The most recently started stream, for metrics (see {@link StreamState}). */
    #lastStream: StreamState | undefined
    /** Served and claimed heights per source, see {@link SourceHeights}. */
    #heights: SourceHeights[]
    /** Guards against firing a second capability probe for a source while one is still in flight. */
    #capabilityProbing: boolean[] = []
    /** Per source: how long eager switch-up stays away after a failure for not delivering. */
    #reclaimBackoff: ReclaimBackoff[]
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
        this.#heights = this.sources.map(() => ({served: undefined, claimed: {latest: undefined, finalized: undefined}}))
        this.#reclaimBackoff = this.sources.map(() => ({failures: 0, delayMs: 0, notBefore: 0}))
    }

    /**
     * Feed a failure to a source's health (the `check` selects the signal), then log *why* — but
     * only when it actually flips the source unhealthy, so a log line always marks a real transition
     * (liveness fails are noisy until they trip the threshold). The bounded `reason`/`code`/`check`
     * also reach {@link metrics}; the full `detail` (incl. the request) is logged, never a label.
     */
    private failSource(i: number, cause: SourceErrorInfo): void {
        let before = this.health[i].state
        switch (cause.check) {
            case 'stream':
                this.health[i].onStreamError(cause)
                break
            case 'liveness':
                this.health[i].onLivenessFail(cause)
                break
            case 'capability':
                this.health[i].onCapability(false, cause)
                break
        }
        if (before !== 'unhealthy' && this.health[i].state === 'unhealthy') {
            this.logger.warn(
                {source: this.sources[i].name, check: cause.check, reason: cause.reason, code: cause.code},
                `fallback source "${this.sources[i].name}" marked unhealthy: ${cause.detail}`,
            )
        }
    }

    getStream(req: StreamRequest): BlockStream<B> {
        return this.runStream(req, false)
    }

    getFinalizedStream(req: StreamRequest): BlockStream<B> {
        return this.runStream(req, true)
    }

    /**
     * Yield the source index to drive, re-selecting on each iteration (after a caller's failover).
     * Owns the all-down accounting shared by streaming and head delegation: when nothing is eligible
     * it clears the active state and waits out the all-down poll, retrying until a source recovers —
     * or throwing `AllSourcesDownError` once the all-down timeout elapses. It never completes
     * normally, so callers loop over it until they return a result or it throws.
     *
     * `exhausted` holds the sources the caller condemned during the current sweep (see
     * {@link exhaust}); they are skipped until every other candidate has been tried. Without this, a
     * failure that takes at least `cooldownMs` to surface (a request timeout) lets the first condemned
     * source cool down while the next one is still failing, and the sweep restarts from index 0
     * forever: `[hung A, hung B, healthy C]` never reaches C. Once no unexhausted candidate is left,
     * the sweep starts over with every recovered source.
     *
     * Eager switch-up also uses `exhausted` to steer the re-selection: it adds every source more
     * preferred than its target (behind the frontier, or not yet proven), so the sweep lands on the
     * target. The next delivered batch clears the set either way.
     *
     * A source that was failed over for not delivering and is still kept away (`reclaimBackoffMs`)
     * is passed over while any other source is eligible. It still claims the tip, so it would
     * otherwise be the first choice of every new stream (the batch processor opens one after each
     * chain reorganisation) as soon as its cooldown ends.
     */
    private async *selectActive(exhausted: Set<number>): AsyncGenerator<number> {
        let allDownSince: number | undefined
        while (true) {
            // First choice: a source that is neither exhausted nor kept away for not delivering.
            let keptAway = this.keptAway()
            let active =
                keptAway.size > 0
                    ? this.selector.pickForFailover(new Set([...exhausted, ...keptAway]))
                    : undefined
            active ??= this.selector.pickForFailover(exhausted)
            if (active == null && exhausted.size > 0) {
                exhausted.clear() // sweep complete: retry whatever has recovered since
                active = this.selector.pickForFailover()
            }
            if (active == null) {
                this.clearActive()
                if (await this.waitAllDown(allDownSince ?? (allDownSince = this.policy.clock()))) continue
                throw new AllSourcesDownError()
            }
            allDownSince = undefined
            yield active
        }
    }

    private async *runStream(req: StreamRequest, finalized: boolean): BlockStream<B> {
        let frontierHash = req.parentHash

        // Fresh per-stream state: a reused instance starting a later (far-behind-head) backfill must
        // not inherit "reached the tip" from a previous run and false-fire on lag.
        let st: StreamState = {kind: finalized ? 'finalized' : 'latest', frontier: req.from - 1, lagArmed: false}
        this.#lastStream = st
        // Served heights are per stream: a new stream has not been served anything yet.
        for (let h of this.#heights) h.served = undefined

        let exhausted = new Set<number>()
        for await (let active of this.selectActive(exhausted)) {
            this.setActive(active)
            st.lagExceededSince = undefined // a switch ends the lag episode
            st.starvation = undefined
            // Time this source served without the stream being behind, for `reclaimBackoffMs`.
            let keptUpMs = 0
            let boundaryAt = this.policy.clock()

            let streamReq: StreamRequest = {from: st.frontier + 1, to: req.to, parentHash: frontierHash}
            let src = this.sources[active].source

            try {
                let iterator = (finalized ? src.getFinalizedStream(streamReq) : src.getStream(streamReq))[
                    Symbol.asyncIterator
                ]()
                try {
                    while (true) {
                        let asked = this.policy.clock()
                        let next = await this.nextWithStaleness(iterator, active, st)
                        // Time the stream waited on the source for this batch; time at `yield`
                        // below is the consumer's and is not counted.
                        let waitedMs = this.policy.clock() - asked
                        if (next === STALE) {
                            // Source stopped delivering while a fresher source is ahead.
                            this.failSource(
                                active,
                                freshnessFailure('stream', 'stale', 'no batch progress while a fresher source was ahead'),
                            )
                            this.exhaust(active, exhausted)
                            break
                        }
                        if (next.done) return // bounded stream finished
                        let batch = next.value

                        // A delivered batch proves both liveness *and* capability: the active source
                        // just served exactly the configured query (an incapable source throws rather
                        // than yields). Confirm capability here — the standby capability probe never
                        // runs for the active source, so without this a cold-start primary would serve
                        // forever yet never leave `unknown` for `healthy`.
                        this.health[active].onBatch()
                        this.health[active].onCapability(true)
                        exhausted.clear() // a delivered batch ends the failover sweep
                        let lastRef = batch.blocks.length
                            ? this.getBlockRef(batch.blocks[batch.blocks.length - 1])
                            : undefined
                        // Served as soon as it is delivered, whatever the consumer does with it.
                        if (lastRef) this.#heights[active].served = lastRef.number
                        let handedOver = this.policy.clock()
                        yield batch
                        // Time the consumer held the batch, as opposed to `waitedMs` above.
                        let consumerMs = this.policy.clock() - handedOver

                        // The resume frontier moves once the consumer asks for more (it took the batch).
                        if (lastRef) {
                            st.frontier = lastRef.number
                            frontierHash = lastRef.hash
                        }

                        if (await this.laggingTooFar(st, active, batch.blocks.length === 0)) {
                            this.failSource(
                                active,
                                freshnessFailure('stream', 'lag', `fell behind the chain head by more than ${this.policy.maxLagBlocks} blocks`),
                            )
                            this.exhaust(active, exhausted)
                            break
                        }

                        // The source may claim the tip and still not deliver it.
                        if (await this.starvedBySource(st, active, waitedMs, consumerMs, batch.blocks.length)) {
                            let keptAwayMs = this.backOffReclaim(active)
                            let detail =
                                `stayed more than ${this.policy.maxLagBlocks} blocks behind the chain head ` +
                                `while waiting on the source for more than ${this.policy.maxStalenessMs}ms` +
                                (keptAwayMs > 0 ? `; not preferred again for ${keptAwayMs}ms` : '')
                            this.failSource(active, freshnessFailure('stream', 'stale', detail))
                            this.exhaust(active, exhausted)
                            break
                        }
                        let now = this.policy.clock()
                        // Good service needs a known lag within bounds: with no reference (every
                        // standby's head request failed) there is no window, but nothing shows the
                        // source keeping up either.
                        let keptUp =
                            st.starvation == null &&
                            st.deliveryLag != null &&
                            this.policy.maxLagBlocks != null &&
                            st.deliveryLag <= this.policy.maxLagBlocks
                        if (keptUp) keptUpMs += now - boundaryAt
                        boundaryAt = now
                        this.forgiveNotDelivering(active, keptUpMs)

                        // Eager switch-up: reclaim a recovered higher-preference source at the
                        // batch boundary (never mid-batch). Probe those candidates first so their
                        // liveness/capability can recover them to `healthy` even when the freshness
                        // head-polls are disabled — switch-up must not depend on that machinery.
                        if (this.policy.preferPrimary === 'eager') {
                            await this.probeHigherPreference(active, st)
                            let up = this.pickSwitchUpTarget(active, st)
                            if (up != null) {
                                // Steer the re-selection past higher-preference sources that are
                                // behind (or unproven); the next delivered batch clears the set.
                                for (let i = 0; i < up; i++) exhausted.add(i)
                                break
                            }
                        }
                    }
                } finally {
                    // Fire-and-forget: a *stalled* source's `return()` can itself hang on the
                    // same unresolved fetch, and failover must not wait on it.
                    safeReturn(iterator)
                }
            } catch (e) {
                if (isForkException(e)) throw e // propagate; do NOT switch
                this.failSource(active, classifyError('stream', e))
                this.exhaust(active, exhausted)
                // re-select and resume from the served frontier on the next iteration
            }
        }
    }

    /**
     * The *claimed* head of the source the stream is driving (see {@link headCandidates}). The
     * processor compares it with its own served position (`isHead`, the chain-height metric), which
     * is the comparison it needs: how far the chain this source can serve is ahead of what it has
     * processed. The answer is also recorded as that source's claim.
     */
    async getHead(): Promise<BlockRef> {
        return this.delegateHead('latest')
    }

    async getFinalizedHead(): Promise<BlockRef> {
        return this.delegateHead('finalized')
    }

    private async delegateHead(kind: HeightKind): Promise<BlockRef> {
        let exhausted = new Set<number>()
        for await (let active of this.headCandidates(exhausted)) {
            try {
                // Time-boxed by `activeHeadTimeoutMs`, not the standby `headPollTimeoutMs`: the active
                // source's head request queues behind its own batch requests, so the tight standby
                // bound would fail over a healthy-but-busy source. A timeout is a liveness failure.
                let timeoutMs = this.policy.activeHeadTimeoutMs
                let head = await withTimeout(
                    this.requestClaim(active, kind),
                    timeoutMs,
                    () => new Error(`head delegation timed out after ${timeoutMs}ms`),
                )
                this.#heights[active].claimed[kind] = {height: head.number, at: this.policy.clock()}
                // A head query *is* the liveness signal (cf. `pollClaim`): a success records a
                // liveness pass, which resets the consecutive-fail counter so earlier transient blips
                // don't accumulate toward `livenessFailThreshold` across intervening successes.
                this.health[active].onLivenessPass()
                return head
            } catch (e) {
                // Gate the failure on the liveness-fail threshold rather than condemning the source on
                // a single blip — head and stream share one `SourceHealth`, so an over-eager mark here
                // would needlessly switch an otherwise-healthy stream. A below-threshold fail leaves
                // the source eligible, so this retries it (transient-friendly) before failing over.
                this.failSource(active, classifyError('liveness', e))
                this.exhaust(active, exhausted)
            }
        }
        throw new AllSourcesDownError() // unreachable: selectActive throws on the all-down timeout
    }

    /**
     * The order in which head delegation asks the sources: the source the stream is driving first,
     * while it is not `unhealthy`, then the usual failover order. The processor derives its chain
     * height (`isHead`, the chain-height metric) from this head, so it has to describe the chain the
     * stream is actually reading. After a failover away from a source parked at its own head, that
     * source becomes eligible again once its cooldown ends; asking it would report its stale head
     * while the stream is far below the real tip.
     */
    private async *headCandidates(exhausted: Set<number>): AsyncGenerator<number> {
        let streaming = this.activeIndex
        // Retry the streaming source through transient failures: only once they have marked it
        // `unhealthy` does the usual failover order (possibly the parked primary) take over.
        while (streaming != null && this.health[streaming].state !== 'unhealthy') {
            yield streaming
        }
        yield* this.selectActive(exhausted)
    }

    /**
     * Exclude `i` from the rest of the current failover sweep once a failure has actually condemned
     * it. A below-threshold liveness fail leaves it eligible, so it is retried as before.
     */
    private exhaust(i: number, exhausted: Set<number>): void {
        if (this.health[i].state === 'unhealthy') exhausted.add(i)
    }

    getBlocksCountInRange(range: FiniteRange): number {
        for (let s of this.sources) {
            if (s.source.getBlocksCountInRange) return s.source.getBlocksCountInRange(range)
        }

        return 0
    }

    /**
     * A Prometheus sink exporting this fallback's observable state (`sqd_fallback_*` gauges). The
     * batch-processor's `run()` calls this automatically when the source is passed to it, so the
     * gauges appear on the processor's `/metrics` with no manual `addMetricsSink` wiring.
     */
    getMetricsSink(): MetricsSink {
        return fallbackMetricsSink(this)
    }

    /** Snapshot of the observable state for export to a metrics surface. */
    metrics(): FallbackMetrics {
        let kind = this.#lastStream?.kind ?? 'latest'
        return {
            activeIndex: this.activeIndex,
            switchCount: this.switchCount,
            lag: this.lag,
            sourceLag: this.sourceLag,
            staleness: this.staleness,
            chainStalled: this.chainStalled,
            chainHead: this.chainHead,
            sources: this.sources.map((s, i) => ({
                name: s.name,
                health: this.health[i].state,
                active: this.activeIndex === i,
                cause: this.health[i].cause,
                servedHeight: this.#heights[i].served,
                claimedHeight: this.#heights[i].claimed[kind]?.height,
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
     * Source lag from the known claims, for metrics: the best claim among the other eligible
     * sources minus the active source's claim (claimed vs claimed). Derived from the cached claims
     * only, never requests one; `0` when either side is unknown.
     */
    get sourceLag(): number {
        let active = this.activeIndex
        if (active == null) return 0
        let kind = this.#lastStream?.kind ?? 'latest'
        let mine = this.#heights[active].claimed[kind]?.height
        if (mine == null) return 0
        let others: number | undefined
        for (let i = 0; i < this.sources.length; i++) {
            if (i === active || this.health[i].state === 'unhealthy') continue
            let h = this.#heights[i].claimed[kind]?.height
            if (h != null && (others == null || h > others)) others = h
        }
        return others == null ? 0 : Math.max(0, others - mine)
    }

    /**
     * The best height the *other* eligible sources claim — an independent reference that avoids
     * the circular-lag trap (a source that stalls head and data together reads lag ≈ 0 against its
     * own claim). Excludes `unhealthy` sources so a flagged-bad one can't define the tip. Claims are
     * cached for `headTtlMs` to bound the probe rate.
     */
    private async othersBestClaim(active: number, st: StreamState, fresh = false): Promise<number | undefined> {
        let results = await Promise.all(
            this.sources.map((_, i) =>
                i === active || this.health[i].state === 'unhealthy'
                    ? Promise.resolve(undefined)
                    : this.pollClaim(i, st, fresh),
            ),
        )
        let vals = results.filter((h): h is number => h != null)

        return vals.length ? Math.max(...vals) : undefined
    }

    /** Whether the claims of all the other eligible sources were polled at or after `since`. */
    private othersPolledSince(active: number, kind: HeightKind, since: number): boolean {
        for (let i = 0; i < this.sources.length; i++) {
            if (i === active || this.health[i].state === 'unhealthy') continue
            let claim = this.#heights[i].claimed[kind]
            if (claim == null || claim.at < since) return false
        }
        return true
    }

    /**
     * The stream's delivery lag right now, against claims polled now rather than cached ones. Used
     * where two lags are compared over time: claims of different ages would distort that by what
     * the chain produced in the meantime (up to `headTtlMs`, plus the time the boundary's own
     * requests took; a whole finality step on a finalized stream).
     */
    private async exactDeliveryLag(st: StreamState, active: number): Promise<number | undefined> {
        let others = await this.othersBestClaim(active, st, true)
        st.deliveryLag = others == null ? undefined : others - st.frontier
        return st.deliveryLag
    }

    /** Ask source `i` for its claimed height of the given kind. */
    private requestClaim(i: number, kind: HeightKind): Promise<BlockRef> {
        let source = this.sources[i].source
        return kind === 'finalized' ? source.getFinalizedHead() : source.getHead()
    }

    /**
     * A standby's claimed height for the current stream kind, cached for `headTtlMs` and
     * time-boxed by `headPollTimeoutMs`. The poll doubles as the liveness probe: a success counts
     * toward the passes that promote a standby to `healthy` (without which it could never be
     * switched up to) and (re)confirms its capability; a failure counts as a liveness failure.
     * `null` timeout defers to the underlying client's own request timeout.
     */
    private async pollClaim(i: number, st: StreamState, fresh = false): Promise<number | undefined> {
        let kind = st.kind
        let now = this.policy.clock()
        let cached = this.#heights[i].claimed[kind]
        if (!fresh && cached && now - cached.at < this.policy.headTtlMs) return cached.height

        let timeoutMs = this.policy.headPollTimeoutMs
        try {
            let head = await withTimeout(
                this.requestClaim(i, kind),
                timeoutMs,
                () => new Error(`head poll timed out after ${timeoutMs}ms`),
            )
            this.#heights[i].claimed[kind] = {height: head.number, at: now}
            this.health[i].onLivenessPass()
            this.#maybeProbeCapability(i, st)
            return head.number
        } catch (e) {
            this.#heights[i].claimed[kind] = {height: undefined, at: now}
            this.failSource(i, classifyError('liveness', e))
            return undefined
        }
    }

    /**
     * The *active* source's claimed height. Time-boxed by `activeHeadTimeoutMs` rather than the
     * standby bound, because the request queues behind the source's own batch requests. A failure
     * returns `undefined` ("not known") and is not counted against the source: the stream itself is
     * its liveness signal. `fresh` skips the cache, for the idle check, where a claim polled a few
     * seconds ago can predate the blocks just delivered.
     */
    private async activeClaim(
        active: number,
        st: StreamState,
        fresh: boolean,
    ): Promise<{height: number | undefined; cached: boolean}> {
        let kind = st.kind
        let now = this.policy.clock()
        let cached = this.#heights[active].claimed[kind]
        if (!fresh && cached?.height != null && now - cached.at < this.policy.headTtlMs) {
            return {height: cached.height, cached: true}
        }
        try {
            let timeoutMs = this.policy.activeHeadTimeoutMs
            let head = await withTimeout(
                this.requestClaim(active, kind),
                timeoutMs,
                () => new Error(`head request timed out after ${timeoutMs}ms`),
            )
            this.#heights[active].claimed[kind] = {height: head.number, at: now}
            return {height: head.number, cached: false}
        } catch {
            return {height: undefined, cached: false}
        }
    }

    /**
     * Drive liveness/capability for the not-yet-active *higher-preference* sources, so a recovered
     * one can reach `healthy` and be reclaimed by eager switch-up. When the active source is the
     * primary (index 0) there are none, so this is a no-op on the hot path; it only does work after
     * a failover, which is exactly when a recovered primary needs to be noticed.
     */
    private async probeHigherPreference(active: number, st: StreamState): Promise<void> {
        await Promise.all(
            this.sources.map((_, i) =>
                i < active && this.health[i].state !== 'unhealthy' ? this.pollClaim(i, st) : Promise.resolve(undefined),
            ),
        )
    }

    /**
     * Fire a source's optional capability probe once it is proven reachable, feeding the result
     * into its health. A source that declares a `probeCapability` cannot become `healthy` on
     * liveness alone — capability must be confirmed — so without this it could never be switched up
     * to. Fire-and-forget (a full capability slice must not block the boundary), and never
     * concurrently for the same source. Periodic re-verification, to catch a source that *loses*
     * capability after confirmation, is a future refinement.
     */
    #maybeProbeCapability(i: number, st: StreamState): void {
        let probe = this.sources[i].probeCapability
        if (!probe || this.health[i].capabilityConfirmed || this.#capabilityProbing[i]) return

        let claimed = this.#heights[i].claimed[st.kind]?.height
        if (claimed == null) return // need a claim to clamp off the tip; skip until one is known

        // Served vs claimed, on purpose: the probe targets the block the stream is about to read
        // (served frontier + lookahead), so during a backfill it verifies the depth it will read in
        // bulk (archive pruning, trace API at old blocks); it is clamped below the source's own claim
        // (minus `capabilityTipMargin`) so a caught-up source probes a settled block it says it has.
        let target = Math.max(
            0,
            Math.min(st.frontier + this.policy.capabilityLookahead, claimed - this.policy.capabilityTipMargin),
        )

        this.#capabilityProbing[i] = true
        // `Promise.resolve().then(() => probe(target))` normalizes a *synchronously*-throwing custom
        // probe into a rejection, so the throw can't escape this method (stranding `#capabilityProbing[i]`
        // at `true` and blocking all future probes for the source) — it flows to the rejection handler
        // and the `.finally` still clears the flag.
        Promise.resolve()
            .then(() => probe(target))
            .then(
                (r) => {
                    if (r.ok) {
                        this.health[i].onCapability(true)
                    } else {
                        this.failSource(i, r.cause ?? capabilityFailure('probe reported not-capable'))
                    }
                },
                (e) => this.failSource(i, classifyError('capability', e)),
            )
            .finally(() => {
                this.#capabilityProbing[i] = false
            })
    }

    /**
     * The most-preferred `healthy` source above `active` that can continue the stream.
     *
     * Claimed vs served, on purpose: the question is whether the candidate can serve the block
     * after the served frontier, so its claim is compared with the frontier, not with the active
     * source's claim. A candidate claiming more than `maxLagBlocks` below the frontier would park
     * the stream on a source with nothing to deliver (e.g. a Portal dataset that does not follow
     * the chain head); within that distance the lag trigger would leave it alone too, so a real-time
     * source that trails by a block or two is still reclaimed. An unknown claim does not block it.
     */
    private pickSwitchUpTarget(active: number, st: StreamState): number | undefined {
        let tolerance = this.policy.maxLagBlocks ?? 0
        let now = this.policy.clock()
        for (let i = 0; i < active; i++) {
            if (this.health[i].state !== 'healthy') continue
            // Failed over for not delivering what it claims: its claim says nothing new yet.
            if (now < this.#reclaimBackoff[i].notBefore) continue
            let claimed = this.#heights[i].claimed[st.kind]?.height
            if (claimed == null || claimed + tolerance >= st.frontier) return i
        }
        return undefined
    }

    /**
     * Source `i` was just failed over for not delivering (see {@link starvedBySource}). It still
     * claims the tip, and its claim is all eager switch-up can check, so keep switch-up away from it
     * for `reclaimBackoffMs`, doubled for each such failure in a row. Selection (a new stream, a
     * failover) passes it over as well while another source is eligible, see {@link selectActive}:
     * otherwise every new stream would start on it again. If no other source is, it is used.
     */
    private backOffReclaim(i: number): number {
        let b = this.#reclaimBackoff[i]
        let factor = Math.min(2 ** b.failures, MAX_RECLAIM_BACKOFF_FACTOR)
        b.failures += 1
        b.delayMs = this.policy.reclaimBackoffMs * factor
        b.notBefore = this.policy.clock() + b.delayMs
        return b.delayMs
    }

    /** The sources eager switch-up and selection currently stay away from, see {@link backOffReclaim}. */
    private keptAway(): Set<number> {
        let now = this.policy.clock()
        let out = new Set<number>()
        this.#reclaimBackoff.forEach((b, i) => {
            if (now < b.notBefore) out.add(i)
        })
        return out
    }

    /**
     * The active source has served for `keptUpMs` with the stream keeping up (no starvation window
     * open, and the delivery lag known and within `maxLagBlocks`). Once that is longer than the
     * source was last kept away, its earlier failures no longer count. Time spent behind the tip
     * does not: a source that is on its way to failing again must not be forgiven first, whatever
     * the delay is.
     */
    private forgiveNotDelivering(active: number, keptUpMs: number): void {
        let b = this.#reclaimBackoff[active]
        if (b.failures > 0 && keptUpMs > b.delayMs) b.failures = 0
    }

    /**
     * Boundary-evaluated lag trigger. It fails the active source over only when the *source* is
     * behind, judged claim against claim: the other sources' best claim exceeds the active source's
     * own claim by more than `maxLagBlocks`. A stream that is behind only because its consumer is
     * slow (the active source claims the tip, the handler has not caught up) never fails over.
     *
     * Two gates decide whether the check runs at all, both against the served frontier:
     * - *Delivery lag* (others' best claim − served frontier) must exceed `maxLagBlocks`. If the
     *   stream is within bounds of the best claim, the active source cannot be behind by more, so no
     *   request for its claim is made. This also arms the trigger (latched per stream) once the
     *   stream first gets within `maxLagBlocks` of the tip, so a historical backfill never fires.
     * - Before the trigger is armed, an empty batch with the active source claiming no more than the
     *   frontier means it is *idle at its own claim*, with nothing left to serve (e.g. a Portal
     *   dataset without real-time data). That enables the check for this boundary only.
     *
     * The active source's claim is cached like the others' (fresh for the idle check). When it is
     * unknown (the request failed), the boundary decides nothing and keeps the grace timer. On a
     * finalized stream, the source lag has to persist for `finalizedLagGraceMs` first: finality
     * advances in steps that another source may claim a few seconds before the active one.
     */
    private async laggingTooFar(st: StreamState, active: number, emptyBatch: boolean): Promise<boolean> {
        st.deliveryLag = undefined
        if (this.policy.maxLagBlocks == null) return false
        let maxLag = this.policy.maxLagBlocks
        let frontier = st.frontier

        let askedAt = this.policy.clock()
        let others = await this.othersBestClaim(active, st)
        if (others != null && !st.lagArmed && others >= frontier && others - frontier <= maxLag) {
            // About to arm. A cached claim is an older, lower one, and would make a stream that never
            // got this close look as if it had, so arm only against claims polled at this boundary.
            // With several standbys their caches rarely expire together: poll them all if needed.
            if (!this.othersPolledSince(active, st.kind, askedAt)) {
                others = await this.othersBestClaim(active, st, true)
            }
            if (others != null && others >= frontier && others - frontier <= maxLag) {
                st.lagArmed = true // arm at tip (latched)
            }
        }
        // Claimed vs served: a lower bound on the chain height — the frontier was served, so the
        // chain is at least that high whatever the other sources claim.
        this.chainHead = others != null ? Math.max(others, frontier) : frontier
        if (others == null) {
            this.lag = 0 // no independent reference ⇒ lag is not computable; don't report a stale value
            st.lagExceededSince = undefined // a later lag episode starts its own grace period
            return false
        }

        // Claimed vs served, on purpose: delivery lag is how far the stream (source and consumer
        // together) is behind the best claim. It gates the check and arms it; it never fires it.
        let deliveryLag = others - frontier
        st.deliveryLag = deliveryLag
        this.lag = Math.max(0, deliveryLag)
        // The trigger is armed above, only once we are genuinely at/near the tip: within the
        // threshold *and* not ahead of the reference. A reference behind us is itself stale or
        // lagging — arming on that would let a later-recovering source's claim trip a spurious
        // failover while we are still backfilling.
        if (deliveryLag <= maxLag) {
            st.lagExceededSince = undefined
            return false
        }
        if (!st.lagArmed && !emptyBatch) {
            // Backfilling below the tip: the check is not armed and the source is delivering.
            st.lagExceededSince = undefined
            return false
        }

        let claim = await this.activeClaim(active, st, emptyBatch)
        // Claims expire independently: a freshly polled standby claim compared with an older cached
        // active claim can show a deficit that is only the age difference. Refresh a cached value
        // before acting on it (a value that was just requested needs no second request).
        if (claim.cached && claim.height != null && others - claim.height > maxLag) {
            claim = await this.activeClaim(active, st, true)
        }
        let activeClaimed = claim.height
        if (activeClaimed == null) return false // not known: decide nothing, keep the grace timer
        // Served vs claimed of the *same* source: idle means it has served all it claims.
        let idle = emptyBatch && activeClaimed <= frontier
        if (!st.lagArmed && !idle) {
            // An empty batch from a source still catching up (finality-only batches) is not idleness.
            st.lagExceededSince = undefined
            return false
        }

        // Claimed vs claimed: the decision itself.
        let sourceLag = others - activeClaimed
        if (sourceLag <= maxLag) {
            // The source claims the tip; the stream is behind because the consumer is slower.
            st.lagExceededSince = undefined
            return false
        }

        if (st.kind === 'finalized' && this.policy.finalizedLagGraceMs > 0) {
            let now = this.policy.clock()
            st.lagExceededSince ??= now
            if (now - st.lagExceededSince < this.policy.finalizedLagGraceMs) return false
        }
        st.lagExceededSince = undefined
        this.chainStalled = false
        return true
    }

    /**
     * Whether the stream is being held back by the active source, judged without its claim. The
     * lag trigger trusts what a source claims, and a claim is unverified: a source can report the
     * tip while its stream returns nothing, or delivers slower than the chain grows. The staleness
     * clock does not see that either, because every batch, even an empty one, restarts it.
     *
     * Served heights and time only: while the stream stays more than `maxLagBlocks` behind the
     * other sources' best claim (the delivery lag of the last boundary), the time it waits on the
     * source is added up. Once that exceeds `maxStalenessMs`, the source is failed over if all of
     * these hold for the window:
     * - the wait on the source was at least as long as the time the consumer held the batches. A
     *   consumer slower than the source spends its time in the handler, not waiting, and never
     *   fails the source over. The supervisor's own head requests count for neither side;
     * - the stream did not get closer to the tip: its delivery lag is no smaller than when the
     *   window opened. A source working through a backlog is left alone. Both lags are taken
     *   against claims polled at that moment, not cached ones (see {@link exactDeliveryLag}); that
     *   costs one round of standby polls when a window opens and one when it is judged;
     * - the lag trigger is armed, or the source delivered no block at all. A historical backfill
     *   that delivers is not failed over for being slow.
     *
     * Otherwise a new window starts. Getting back within `maxLagBlocks`, losing the reference and
     * switching sources all close the window. Getting back is confirmed against freshly polled
     * claims too: against a cached claim a stream that keeps a steady distance looks as if it
     * caught up shortly before every new poll. Needs both `maxLagBlocks` and `maxStalenessMs`.
     */
    private async starvedBySource(
        st: StreamState,
        active: number,
        waitedMs: number,
        consumerMs: number,
        deliveredBlocks: number,
    ): Promise<boolean> {
        let maxLag = this.policy.maxLagBlocks
        let maxWaitMs = this.policy.maxStalenessMs
        if (maxLag == null || maxWaitMs == null) {
            st.starvation = undefined
            return false
        }

        // Against cached claims the lag can only be understated (an older claim is a lower one), so
        // "behind" needs no confirmation, while "caught up" does.
        let behind = st.deliveryLag != null && st.deliveryLag > maxLag
        let w = st.starvation
        if (w == null && !behind) return false
        let judge = false
        if (w != null) {
            w.waitMs += waitedMs
            w.consumerMs += consumerMs
            w.blocks += deliveredBlocks
            judge = w.waitMs > maxWaitMs
            if (behind && !judge) return false
        }
        // A window opens, is judged, or looks caught up: each needs the exact lag.
        let lag = await this.exactDeliveryLag(st, active)
        if (lag == null || lag <= maxLag) {
            st.starvation = undefined
            return false
        }
        if (w != null && !judge) return false // only the cached claim said it had caught up
        if (w != null) {
            let sourceBound = w.waitMs >= w.consumerMs
            let gettingCloser = lag < w.startLag
            let backfilling = !st.lagArmed && w.blocks > 0
            if (sourceBound && !gettingCloser && !backfilling) {
                st.starvation = undefined
                this.chainStalled = false
                return true
            }
        }
        // The wait for this batch ended before the window opened: it is not counted.
        st.starvation = {since: this.policy.clock(), waitMs: 0, consumerMs: 0, blocks: 0, startLag: lag}
        return false
    }

    /**
     * `iterator.next()` with the source-pending staleness clock. While the request is
     * outstanding (and only then — never while parked at `yield`), a ticker checks how long it
     * has been pending; past `maxStalenessMs` it fails the source over **iff** a fresher source
     * is ahead. If every source sits at the same stale head, it is a global chain stall: there is
     * nothing fresher to switch to, so hold the active source and flag `chainStalled` rather than
     * churn pointlessly through sources that are all equally stuck.
     *
     * The hold is not passive: each time staleness re-trips, `othersBestClaim` re-polls the other
     * sources — which doubles as their liveness/capability probe — so the supervisor keeps watching
     * for recovery. It leaves the hold the moment any of: the active source delivers the next batch
     * (chain resumed where we are), the active source errors (ordinary failover), or another source
     * claims blocks past the served frontier (⇒ `STALE`, fail over to it).
     */
    private async nextWithStaleness(
        iterator: AsyncIterator<BlockBatch<B>>,
        active: number,
        st: StreamState,
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
                // Re-polling the other sources both decides failover and (re)probes their
                // liveness/capability, so a held source keeps noticing when the chain comes back.
                let others = await this.othersBestClaim(active, st)
                // Claimed vs served, on purpose: the active source has served nothing for
                // `maxStalenessMs`, so what it claims says nothing about whether it is stuck; what
                // matters is that another source claims blocks the stream does not have yet.
                if (others != null && others > st.frontier) {
                    this.chainStalled = false
                    return STALE
                }
                // Global stall: every source is equally stuck, so there is nowhere fresher to go.
                // Hold the active source (re-arm and keep waiting + probing) rather than churn.
                this.chainStalled = true
                start = this.policy.clock()
            }
        }
    }

    private setActive(i: number): void {
        // Count a switch against the last source we drove (not `activeIndex`, which is cleared to
        // `undefined` during an all-down gap) so resuming on a *different* source after the gap
        // still registers, and resuming on the *same* one does not.
        if (this.#lastActive !== undefined && this.#lastActive !== i) {
            this.switchCount++
            // On a switch the previous source's gauge values are stale — clear them until the new
            // source's next batch/head poll repopulates them.
            this.resetFreshnessGauges()
        }
        this.#lastActive = i
        this.activeIndex = i
    }

    /** No source is eligible (all unhealthy): nothing is being driven, so report no active source. */
    private clearActive(): void {
        this.activeIndex = undefined
        this.resetFreshnessGauges() // no active source ⇒ no gauge readings to report for the gap
    }

    /**
     * Clear the freshness gauges. They describe the *active* source, so both a switch and an all-down
     * gap make the previous source's lag/staleness/stall readings stale (e.g. `nextWithStaleness`
     * returning `STALE` can leave `staleness` non-zero); they repopulate on the next batch/head poll.
     */
    private resetFreshnessGauges(): void {
        this.lag = 0
        this.staleness = 0
        this.chainStalled = false
        this.chainHead = undefined
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
    return delay(ms).promise
}
