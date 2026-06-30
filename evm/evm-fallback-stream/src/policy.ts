/** Trinary health (plan §4): `unknown` lets the first batch ship before any probe completes. */
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
     * Fail the active source over when it falls more than this many blocks behind an
     * *independent* chain-head reference (the max head of the other eligible sources). Armed
     * only once the tip is first reached, so a long historical backfill never false-fires.
     * `10` by default; `null` disables the lag trigger. (M1 / D9.)
     */
    maxLagBlocks?: number | null
    /**
     * Fail the active source over when its next-batch request stays outstanding this long (the
     * source-pending clock — excludes time parked at `yield` awaiting the consumer). `180_000`
     * ms by default; `null` disables the staleness trigger. (M1 / D9.)
     */
    maxStalenessMs?: number | null
    /** How often the staleness clock is checked while a request is outstanding. */
    freshnessTickMs?: number
    /** Max age of a cached per-source head before it is re-fetched for the lag reference. */
    headTtlMs?: number
    /**
     * Blocks ahead of the indexing frontier (last committed height) a capability probe targets, so
     * it verifies the source can serve the data it is *about* to read. `16` by default. (§4.)
     */
    capabilityLookahead?: number
    /**
     * Blocks below the chain tip a capability probe is clamped to, so a caught-up source probes a
     * settled block rather than the reorg-prone/maybe-unpropagated tip. `16` by default. (§4.)
     */
    capabilityTipMargin?: number
    /**
     * When *every* source sits at the same stale head (the chain itself is stuck), there is
     * nothing fresher to switch to. `false` (default) holds the active source and emits a
     * `chain-stalled` signal instead of churning.
     */
    churnOnGlobalStall?: boolean
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
    maxStalenessMs: number | null
    freshnessTickMs: number
    headTtlMs: number
    capabilityLookahead: number
    capabilityTipMargin: number
    churnOnGlobalStall: boolean
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
    maxStalenessMs: 180_000,
    freshnessTickMs: 1000,
    headTtlMs: 5000,
    capabilityLookahead: 16,
    capabilityTipMargin: 16,
    churnOnGlobalStall: false,
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
        maxStalenessMs: orDefault(p?.maxStalenessMs, DEFAULT_POLICY.maxStalenessMs),
        freshnessTickMs: p?.freshnessTickMs ?? DEFAULT_POLICY.freshnessTickMs,
        headTtlMs: p?.headTtlMs ?? DEFAULT_POLICY.headTtlMs,
        capabilityLookahead: p?.capabilityLookahead ?? DEFAULT_POLICY.capabilityLookahead,
        capabilityTipMargin: p?.capabilityTipMargin ?? DEFAULT_POLICY.capabilityTipMargin,
        churnOnGlobalStall: orDefault(p?.churnOnGlobalStall, DEFAULT_POLICY.churnOnGlobalStall),
        clock: p?.clock ?? DEFAULT_POLICY.clock,
    }
}

export class AllSourcesDownError extends Error {
    constructor() {
        super('all fallback data sources are unavailable')
        this.name = 'AllSourcesDownError'
    }
}
