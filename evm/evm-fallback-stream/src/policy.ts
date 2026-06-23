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
     * (the no-downtime goal); a finite value waits that long then throws `AllSourcesDown`.
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
    clock: () => number
}

export const DEFAULT_POLICY: ResolvedPolicy = {
    preferPrimary: 'eager',
    allDownTimeoutMs: null,
    allDownPollMs: 1000,
    cooldownMs: 30_000,
    livenessFailThreshold: 2,
    livenessRecoverThreshold: 3,
    clock: () => Date.now(),
}

export function resolvePolicy(p?: FallbackPolicy): ResolvedPolicy {
    return {
        preferPrimary: p?.preferPrimary ?? DEFAULT_POLICY.preferPrimary,
        allDownTimeoutMs: p?.allDownTimeoutMs === undefined ? DEFAULT_POLICY.allDownTimeoutMs : p.allDownTimeoutMs,
        allDownPollMs: p?.allDownPollMs ?? DEFAULT_POLICY.allDownPollMs,
        cooldownMs: p?.cooldownMs ?? DEFAULT_POLICY.cooldownMs,
        livenessFailThreshold: p?.livenessFailThreshold ?? DEFAULT_POLICY.livenessFailThreshold,
        livenessRecoverThreshold: p?.livenessRecoverThreshold ?? DEFAULT_POLICY.livenessRecoverThreshold,
        clock: p?.clock ?? DEFAULT_POLICY.clock,
    }
}

export class AllSourcesDownError extends Error {
    constructor() {
        super('all fallback data sources are unavailable')
        this.name = 'AllSourcesDownError'
    }
}
