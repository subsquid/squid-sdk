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
 * can promote them.
 */
export class SourceHealth {
    #state: Health = 'unknown'
    #livenessPass = 0
    #livenessFail = 0
    #capabilityOk: boolean
    #cooldownUntil = 0

    constructor(
        private policy: ResolvedPolicy,
        hasCapabilityProbe: boolean,
    ) {
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

    onStreamError(): void {
        this.#toUnhealthy()
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

    onLivenessFail(): void {
        if (this.state === 'unhealthy') return
        this.#livenessPass = 0
        this.#livenessFail++
        if (this.#livenessFail >= this.policy.livenessFailThreshold) {
            this.#toUnhealthy()
        }
    }

    onCapability(ok: boolean): void {
        if (this.state === 'unhealthy') return
        if (ok) {
            this.#capabilityOk = true
            this.#maybeHealthy()
        } else {
            this.#toUnhealthy()
        }
    }

    #maybeHealthy(): void {
        if (this.#capabilityOk && this.#livenessPass >= this.policy.livenessRecoverThreshold) {
            this.#state = 'healthy'
        }
    }

    #toUnhealthy(): void {
        this.#state = 'unhealthy'
        this.#cooldownUntil = this.policy.clock() + this.policy.cooldownMs
        this.#livenessPass = 0
        this.#livenessFail = 0
    }

    #toUnknown(): void {
        this.#state = 'unknown'
        this.#livenessPass = 0
        this.#livenessFail = 0
    }
}
