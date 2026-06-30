import {SourceErrorInfo} from './diagnostics'
import {Health, ResolvedPolicy} from './policy'

/**
 * Per-source trinary health state machine (plan §4). Pure and timer-free — the driver feeds it
 * signals (`onStreamError`, `onBatch`, liveness/capability probe results) and reads `state`;
 * cooldown expiry is resolved lazily against the injected clock on each `state` read.
 *
 * Transitions:
 *  - any → `unhealthy` on a stream error, `K` consecutive liveness fails, or a capability fail.
 *  - `unhealthy` → `unknown` once `cooldownMs` elapses (re-probing resumes).
 *  - `unknown` → `healthy` when capability is confirmed AND `M` consecutive liveness passes.
 *
 * Sources without a capability probe treat capability as always-confirmed, so liveness alone
 * can promote them. For a source *with* a probe, capability is dropped whenever it goes
 * unhealthy, so it can never return to `healthy` until a fresh probe succeeds — liveness alone
 * cannot resurrect a node that keeps failing the real query (the churn loop).
 */
export class SourceHealth {
    #state: Health = 'unknown'
    #livenessPass = 0
    #livenessFail = 0
    #hasCapabilityProbe: boolean
    #capabilityOk: boolean
    #cooldownUntil = 0
    #cause: SourceErrorInfo | undefined

    constructor(
        private policy: ResolvedPolicy,
        hasCapabilityProbe: boolean,
    ) {
        this.#hasCapabilityProbe = hasCapabilityProbe
        this.#capabilityOk = !hasCapabilityProbe
    }

    get state(): Health {
        if (this.#state === 'unhealthy' && this.policy.clock() >= this.#cooldownUntil) {
            this.#toUnknown()
        }

        return this.#state
    }

    /** Remaining cooldown in ms (0 when not cooling down). */
    get cooldownRemaining(): number {
        return this.#state === 'unhealthy' ? Math.max(0, this.#cooldownUntil - this.policy.clock()) : 0
    }

    /** True once capability has been confirmed — or always, for a source with no capability probe. */
    get capabilityConfirmed(): boolean {
        return this.#capabilityOk
    }

    /** Why the source is currently unhealthy (`undefined` unless `state === 'unhealthy'`). */
    get cause(): SourceErrorInfo | undefined {
        return this.state === 'unhealthy' ? this.#cause : undefined
    }

    onStreamError(cause?: SourceErrorInfo): void {
        this.#toUnhealthy(cause)
    }

    /** A delivered batch is a strong liveness signal. */
    onBatch(): void {
        this.onLivenessPass()
    }

    onLivenessPass(): void {
        if (this.state === 'unhealthy') return
        this.#livenessFail = 0
        this.#livenessPass++
        this.#maybeHealthy()
    }

    onLivenessFail(cause?: SourceErrorInfo): void {
        if (this.state === 'unhealthy') return
        this.#livenessPass = 0
        this.#livenessFail++
        if (this.#livenessFail >= this.policy.livenessFailThreshold) {
            this.#toUnhealthy(cause)
        }
    }

    onCapability(ok: boolean, cause?: SourceErrorInfo): void {
        if (this.state === 'unhealthy') return
        if (ok) {
            this.#capabilityOk = true
            this.#maybeHealthy()
        } else {
            this.#toUnhealthy(cause)
        }
    }

    #maybeHealthy(): void {
        if (this.#capabilityOk && this.#livenessPass >= this.policy.livenessRecoverThreshold) {
            this.#state = 'healthy'
            this.#cause = undefined
        }
    }

    #toUnhealthy(cause?: SourceErrorInfo): void {
        this.#state = 'unhealthy'
        this.#cooldownUntil = this.policy.clock() + this.policy.cooldownMs
        this.#livenessPass = 0
        this.#livenessFail = 0
        this.#cause = cause
        // A probed source must re-prove it can serve the query before it can recover; otherwise a
        // node that stays reachable but keeps failing the real query would flap back to healthy on
        // liveness alone, get re-promoted, fail again — the churn loop.
        this.#capabilityOk = !this.#hasCapabilityProbe
    }

    #toUnknown(): void {
        this.#state = 'unknown'
        this.#livenessPass = 0
        this.#livenessFail = 0
        this.#cause = undefined
    }
}
