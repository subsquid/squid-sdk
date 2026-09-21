import {Registry} from 'prom-client'
import {describe, expect, it} from 'vitest'

import {FallbackMetrics} from './fallback'
import {fallbackMetricsSink} from './metrics'

const snapshot: FallbackMetrics = {
    activeIndex: 1,
    switchCount: 2,
    lag: 7,
    staleness: 1500,
    chainStalled: true,
    chainHead: 100,
    sources: [
        {
            name: 'portal',
            health: 'unhealthy',
            active: false,
            cause: {check: 'capability', reason: 'http', code: 400, detail: 'capability check failed: http 400, request: …'},
        },
        {name: 'rpc', health: 'unknown', active: true},
    ],
}

describe('fallbackMetricsSink', () => {
    it('exposes the fallback state as Prometheus gauges', async () => {
        let registry = new Registry()
        fallbackMetricsSink({metrics: () => snapshot}).register(registry)

        let text = await registry.metrics()

        expect(text).toContain('sqd_fallback_active{source="rpc"} 1')
        expect(text).toContain('sqd_fallback_active{source="portal"} 0')
        expect(text).toContain('sqd_fallback_source_health{source="rpc",state="unknown",check="",reason="",code=""} 1')
        expect(text).toContain('sqd_fallback_source_health{source="rpc",state="healthy",check="",reason="",code=""} 0')
        // The unhealthy row carries the cause as bounded labels; the request stays out of metrics.
        expect(text).toContain(
            'sqd_fallback_source_health{source="portal",state="unhealthy",check="capability",reason="http",code="400"} 1',
        )
        expect(text).not.toContain('capability check failed') // the full detail never leaks into metrics
        expect(text).toContain('sqd_fallback_lag_blocks 7')
        expect(text).toContain('sqd_fallback_staleness_ms 1500')
        expect(text).toContain('sqd_fallback_chain_stalled 1')
        expect(text).toContain('sqd_fallback_switches 2')
    })

    it('is idempotent on a registry — registering the same source twice does not throw or duplicate', async () => {
        let registry = new Registry()
        let src = {metrics: () => snapshot}
        // The batch-processor auto-registers plus a leftover manual add would both hit the same registry.
        fallbackMetricsSink(src).register(registry)
        expect(() => fallbackMetricsSink(src).register(registry)).not.toThrow()

        let text = await registry.metrics()
        expect(text.match(/sqd_fallback_switches 2/g)).toHaveLength(1)
    })

    it('honours a custom prefix', async () => {
        let registry = new Registry()
        fallbackMetricsSink({metrics: () => snapshot}, 'myapp_fb').register(registry)
        expect(await registry.metrics()).toContain('myapp_fb_switches 2')
    })
})
