import {describe, expect, it} from 'vitest'

import {SourceHealth} from './health'
import {resolvePolicy} from './policy'

function setup(opts: {hasCapabilityProbe?: boolean; cooldownMs?: number} = {}) {
    let now = 0
    let policy = resolvePolicy({
        clock: () => now,
        cooldownMs: opts.cooldownMs ?? 1000,
        livenessFailThreshold: 2,
        livenessRecoverThreshold: 3,
    })
    let health = new SourceHealth(policy, opts.hasCapabilityProbe ?? false)

    return {health, advance: (ms: number) => (now += ms)}
}

describe('SourceHealth', () => {
    it('starts unknown', () => {
        expect(setup().health.state).toBe('unknown')
    })

    it('a stream error flips it unhealthy, and cooldown returns it to unknown', () => {
        let {health, advance} = setup({cooldownMs: 1000})
        health.onStreamError()
        expect(health.state).toBe('unhealthy')

        advance(999)
        expect(health.state).toBe('unhealthy')
        advance(1)
        expect(health.state).toBe('unknown')
    })

    it('promotes unknown → healthy after M liveness passes (no capability probe)', () => {
        let {health} = setup({hasCapabilityProbe: false})
        health.onLivenessPass()
        health.onLivenessPass()
        expect(health.state).toBe('unknown')
        health.onLivenessPass() // M = 3
        expect(health.state).toBe('healthy')
    })

    it('with a capability probe, liveness alone is not enough', () => {
        let {health} = setup({hasCapabilityProbe: true})
        health.onLivenessPass()
        health.onLivenessPass()
        health.onLivenessPass()
        expect(health.state).toBe('unknown') // capability not yet confirmed
        health.onCapability(true)
        expect(health.state).toBe('healthy')
    })

    it('K consecutive liveness fails flip it unhealthy', () => {
        let {health} = setup()
        health.onLivenessFail()
        expect(health.state).toBe('unknown')
        health.onLivenessFail() // K = 2
        expect(health.state).toBe('unhealthy')
    })

    it('a failed capability probe flips it unhealthy', () => {
        let {health} = setup({hasCapabilityProbe: true})
        health.onCapability(false)
        expect(health.state).toBe('unhealthy')
    })

    it('a single liveness pass does not reset the unhealthy cooldown', () => {
        let {health} = setup({cooldownMs: 1000})
        health.onStreamError()
        health.onLivenessPass() // ignored while cooling down
        expect(health.state).toBe('unhealthy')
    })
})
