/** Trinary health: `unknown` lets the first batch ship before any probe completes. */
export type Health = 'healthy' | 'unhealthy' | 'unknown'

export interface FallbackPolicy {
    /**
     * `eager` (default) proactively switches *up* to a recovered higher-preference source at a
     * batch boundary; `onFailureOnly` only ever switches on failure.
     */
    preferPrimary?: 'eager' | 'onFailureOnly'
    /**
     * When every source is unavailable: `null` (default) polls indefinitely until one recovers
     * (the no-downtime goal); a finite value waits that long then throws `AllSourcesDownError`.
     */
    allDownTimeoutMs?: number | null
    /** Backoff between all-sources-down poll attempts. */
    allDownPollMs?: number
    /** Cooldown an `unhealthy` source waits before it returns to `unknown` and is re-probed. */
    cooldownMs?: number
    /** `K` — consecutive failed liveness probes that flip a source `unhealthy`. */
    livenessFailThreshold?: number
    /** `M` — consecutive liveness passes (with capability confirmed) required to become `healthy`. */
    livenessRecoverThreshold?: number
    /**
     * Fail the active source over when the height it *claims* (its head endpoint) trails the best
     * height the other eligible sources claim by more than this many blocks (finalized heads on a
     * finalized stream). Claims are compared with claims: a stream that is behind only because its
     * consumer is slower than a healthy source never fails over.
     *
     * The check runs only when the stream's *served* frontier (the last block it delivered) is
     * itself more than this many blocks below the others' best claim, so no extra request is made
     * at the tip. It arms once the frontier first gets within this distance of the tip, so a long
     * historical backfill never fires it. Before that, a source that is idle at its own claim (an
     * empty batch, and a claim no higher than the frontier), such as a Portal dataset without
     * real-time data, is checked too. When the active source's claim is unknown (its head request
     * failed), no lag failover happens at that boundary; the staleness trigger still applies.
     *
     * A claim is unverified, so this alone would keep a source that claims the tip but does not
     * deliver it. That case is covered by `maxStalenessMs`.
     *
     * The same distance is the tolerance for eager switch-up: a candidate whose claim is more
     * than this below the served frontier is not reclaimed. `10` by default; `null` disables the
     * lag trigger, including the idle-head failover, and makes the switch-up tolerance 0.
     *
     * Known limits: the idle check needs an empty batch, so when the active source's head sits
     * inside a gap between the configured query ranges (no batch is yielded while the gap drains),
     * only the staleness trigger moves the stream, after `maxStalenessMs`. It also needs a reference
     * claim, so a standby whose head polls keep exceeding `headPollTimeoutMs` cannot supply one.
     */
    maxLagBlocks?: number | null
    /**
     * On a finalized stream, how long the active source's claimed finalized height has to trail
     * the others' by more than `maxLagBlocks` before it is failed over. Finality advances in steps
     * (32-block epochs on Ethereum), and another source may claim a step a few seconds before the
     * active one; a source parked at its own finalized head stays behind. `60_000` ms by default; `0` fails over at once.
     * Unfinalized streams fail over at once.
     */
    finalizedLagGraceMs?: number
    /**
     * Fail the active source over when its next-batch request stays outstanding this long (the
     * source-pending clock — excludes time parked at `yield` awaiting the consumer).
     *
     * The same limit applies to a source that keeps answering but does not keep up, whatever
     * height it claims: while the stream stays more than `maxLagBlocks` behind the other sources'
     * best claim, the time it waits on the active source is added up, and past this limit the
     * source is failed over unless it supplied blocks faster than the chain made them (blocks per
     * millisecond waited on it, against the chain's blocks per millisecond of wall time). A
     * consumer slower than the source therefore never fails it over, and neither does a historical
     * backfill that makes headway; a source slower than the chain is failed over even when the
     * consumer is slower still. Left alone as well: a source that has made headway and is slower
     * than the chain for a while (`slowdownGraceMs`), and a source with no better one to go to
     * (`reclaimBackoffMs`). This part also needs `maxLagBlocks` to be set.
     * The two lags it compares are taken against freshly polled claims, so the standbys are polled
     * on the batch path when such a spell starts and when it is judged; these polls are bounded by
     * `headPollTimeoutMs` like any other, and count as liveness probes.
     *
     * Known limit: the time is added up per stream. A consumer that opens a new stream (the batch
     * processor does after every chain reorganisation) starts the count over, so on a chain that
     * reorganises more often than this limit a source that delivers too slowly can stay active.
     *
     * `180_000` ms by default; `null` disables the staleness trigger.
     */
    maxStalenessMs?: number | null
    /**
     * How long a source that delivers blocks may stay slower than the chain before it is failed
     * over for not keeping up (the second part of `maxStalenessMs`), provided the stream is still
     * closer to the tip than when it first fell behind. A backfill that crosses a stretch of heavy
     * blocks can be slower than the chain for a while with nothing wrong with the source, and the
     * other sources are usually slower still. A source that delivers nothing, or that has made no
     * headway at all (a stream that starts behind on a source that cannot keep up), gets no such
     * allowance and is failed over after `maxStalenessMs`.
     *
     * `900_000` ms (15 minutes) by default; `0` fails a source over as soon as one
     * `maxStalenessMs` of waiting passes without the stream getting closer to the tip.
     */
    slowdownGraceMs?: number
    /**
     * How long the fallback stays away from a source that was failed over for not delivering (the
     * second part of `maxStalenessMs`). Such a source still claims the tip, and a claim is all
     * eager switch-up can check, so without this it would be taken back as soon as its cooldown
     * ends and the stream would spend most of its time on it. The delay doubles each time the source fails
     * the same way again, up to 16 times this value, and starts over once the source, taken back,
     * has served for longer than it was kept away without a stream on it falling more than
     * `maxLagBlocks` behind (in one spell, which may span several streams). Time with no other
     * source to compare against counts as such service.
     *
     * In that time the source is also passed over when a new stream starts or the stream fails
     * over, as long as another source is eligible. If no other source is, it is used at once.
     *
     * When every other source is being kept away like this, the active one is not failed over for
     * the same reason: the stream stays on whichever supplied blocks fastest instead of alternating
     * between sources that are all too slow.
     * `1_800_000` ms (30 minutes) by default; `0` takes the source back right after its cooldown.
     */
    reclaimBackoffMs?: number
    /** How often the staleness clock is checked while a request is outstanding. */
    freshnessTickMs?: number
    /** Max age of a cached per-source head before it is re-fetched for the lag reference. */
    headTtlMs?: number
    /**
     * Time-box each independent head poll. Because a head poll is `await`ed on the batch-critical
     * path (lag check, staleness hold, switch-up), an unbounded one lets a *sick standby* — TCP up
     * but not responding — stall an otherwise-healthy active source. A poll exceeding this counts as
     * a liveness failure for that source and returns no head. `500` ms by default; `null` disables
     * the guard and relies on the underlying client's own request timeout. The lag reference comes
     * from these polls, so raise it for a standby whose first request on a cold connection is
     * slower than that (public RPC endpoints often take 0.5 to 1 s).
     */
    headPollTimeoutMs?: number | null
    /**
     * Time-box the *active* source's `getHead()` / `getFinalizedHead()`, which the processor awaits
     * before every batch. Without it, a source that accepts the connection but never responds stalls
     * the processor forever and never fails over. A timeout counts as a liveness failure, so the
     * source is retried and failed over after `livenessFailThreshold` consecutive timeouts.
     *
     * Deliberately separate from (and much larger than) `headPollTimeoutMs`: the active source's head
     * request queues behind its own in-flight batch requests, so a tight bound would fail over a
     * healthy-but-busy source. Keep it above the source client's own worst case — for an RPC source,
     * `requestTimeout × (retryAttempts + 1)` — so the client's error normally fires first.
     * `60_000` ms by default; `null` disables the guard.
     */
    activeHeadTimeoutMs?: number | null
    /**
     * Blocks ahead of the indexing frontier (last committed height) a capability probe targets, so
     * it verifies the source can serve the data it is *about* to read. `16` by default.
     */
    capabilityLookahead?: number
    /**
     * Blocks below the chain tip a capability probe is clamped to, so a caught-up source probes a
     * settled block rather than the reorg-prone/maybe-unpropagated tip. `16` by default.
     */
    capabilityTipMargin?: number
    /** Injectable clock (ms), for deterministic tests. Defaults to `Date.now`. */
    clock?: () => number
}

export interface ResolvedPolicy {
    preferPrimary: 'eager' | 'onFailureOnly'
    allDownTimeoutMs: number | null
    allDownPollMs: number
    cooldownMs: number
    livenessFailThreshold: number
    livenessRecoverThreshold: number
    maxLagBlocks: number | null
    finalizedLagGraceMs: number
    maxStalenessMs: number | null
    slowdownGraceMs: number
    reclaimBackoffMs: number
    freshnessTickMs: number
    headTtlMs: number
    headPollTimeoutMs: number | null
    activeHeadTimeoutMs: number | null
    capabilityLookahead: number
    capabilityTipMargin: number
    clock: () => number
}

export const DEFAULT_POLICY: ResolvedPolicy = {
    preferPrimary: 'eager',
    allDownTimeoutMs: null,
    allDownPollMs: 1000,
    cooldownMs: 30_000,
    livenessFailThreshold: 2,
    livenessRecoverThreshold: 3,
    maxLagBlocks: 10,
    finalizedLagGraceMs: 60_000,
    maxStalenessMs: 180_000,
    slowdownGraceMs: 900_000,
    reclaimBackoffMs: 1_800_000,
    freshnessTickMs: 1000,
    headTtlMs: 5000,
    headPollTimeoutMs: 500,
    activeHeadTimeoutMs: 60_000,
    capabilityLookahead: 16,
    capabilityTipMargin: 16,
    clock: () => Date.now(),
}

function orDefault<T>(value: T | undefined, fallback: T): T {
    return value === undefined ? fallback : value
}

export function resolvePolicy(p?: FallbackPolicy): ResolvedPolicy {
    return {
        preferPrimary: p?.preferPrimary ?? DEFAULT_POLICY.preferPrimary,
        allDownTimeoutMs: orDefault(p?.allDownTimeoutMs, DEFAULT_POLICY.allDownTimeoutMs),
        allDownPollMs: p?.allDownPollMs ?? DEFAULT_POLICY.allDownPollMs,
        cooldownMs: p?.cooldownMs ?? DEFAULT_POLICY.cooldownMs,
        livenessFailThreshold: p?.livenessFailThreshold ?? DEFAULT_POLICY.livenessFailThreshold,
        livenessRecoverThreshold: p?.livenessRecoverThreshold ?? DEFAULT_POLICY.livenessRecoverThreshold,
        maxLagBlocks: orDefault(p?.maxLagBlocks, DEFAULT_POLICY.maxLagBlocks),
        finalizedLagGraceMs: p?.finalizedLagGraceMs ?? DEFAULT_POLICY.finalizedLagGraceMs,
        maxStalenessMs: orDefault(p?.maxStalenessMs, DEFAULT_POLICY.maxStalenessMs),
        slowdownGraceMs: p?.slowdownGraceMs ?? DEFAULT_POLICY.slowdownGraceMs,
        reclaimBackoffMs: p?.reclaimBackoffMs ?? DEFAULT_POLICY.reclaimBackoffMs,
        freshnessTickMs: p?.freshnessTickMs ?? DEFAULT_POLICY.freshnessTickMs,
        headTtlMs: p?.headTtlMs ?? DEFAULT_POLICY.headTtlMs,
        headPollTimeoutMs: orDefault(p?.headPollTimeoutMs, DEFAULT_POLICY.headPollTimeoutMs),
        activeHeadTimeoutMs: orDefault(p?.activeHeadTimeoutMs, DEFAULT_POLICY.activeHeadTimeoutMs),
        capabilityLookahead: p?.capabilityLookahead ?? DEFAULT_POLICY.capabilityLookahead,
        capabilityTipMargin: p?.capabilityTipMargin ?? DEFAULT_POLICY.capabilityTipMargin,
        clock: p?.clock ?? DEFAULT_POLICY.clock,
    }
}

export class AllSourcesDownError extends Error {
    constructor() {
        super('all fallback data sources are unavailable')
        this.name = 'AllSourcesDownError'
    }
}
