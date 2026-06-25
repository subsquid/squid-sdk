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
        {name: 'portal', health: 'unhealthy', active: false},
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
        expect(text).toContain('sqd_fallback_source_health{source="rpc",state="unknown"} 1')
        expect(text).toContain('sqd_fallback_source_health{source="rpc",state="healthy"} 0')
        expect(text).toContain('sqd_fallback_lag_blocks 7')
        expect(text).toContain('sqd_fallback_staleness_ms 1500')
        expect(text).toContain('sqd_fallback_chain_stalled 1')
        expect(text).toContain('sqd_fallback_switches 2')
    })
})
