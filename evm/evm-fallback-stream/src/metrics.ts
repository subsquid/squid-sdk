import {Gauge, Registry} from 'prom-client'

import {FallbackMetrics} from './fallback'

export interface FallbackMetricsSource {
    metrics(): FallbackMetrics
}

/**
 * Matches `@subsquid/util-internal-processor-tools`' `MetricsSink`, so a fallback's metrics can be
 * added to the processor's `PrometheusServer` via `addMetricsSink(...)` (the processor's existing
 * metrics surface, §4).
 */
export interface MetricsSink {
    register(registry: Registry): void | Promise<void>
}

const HEALTH_STATES = ['healthy', 'unhealthy', 'unknown'] as const

/**
 * A `MetricsSink` exporting a {@link FallbackDataSource}'s observable state as Prometheus gauges
 * (§4 — "unhealthiness reflected in metrics"): which source is active, per-source trinary health,
 * lag/staleness/chain-stalled, and the cumulative switch count. Each gauge reads `source.metrics()`
 * on scrape via prom-client's `collect`, so there is nothing to push.
 */
export function fallbackMetricsSink(source: FallbackMetricsSource, prefix = 'sqd_fallback'): MetricsSink {
    return {
        register(registry: Registry) {
            new Gauge({
                name: `${prefix}_active`,
                help: 'Currently active fallback source (1 = active, 0 = standby)',
                labelNames: ['source'],
                registers: [registry],
                collect() {
                    for (let s of source.metrics().sources) this.set({source: s.name}, s.active ? 1 : 0)
                },
            })

            new Gauge({
                name: `${prefix}_source_health`,
                help: 'Per-source trinary health (1 for the current state, 0 otherwise)',
                labelNames: ['source', 'state'],
                registers: [registry],
                collect() {
                    for (let s of source.metrics().sources) {
                        for (let state of HEALTH_STATES) this.set({source: s.name, state}, s.health === state ? 1 : 0)
                    }
                },
            })

            new Gauge({
                name: `${prefix}_lag_blocks`,
                help: 'Blocks behind the independent chain-head reference',
                registers: [registry],
                collect() {
                    this.set(source.metrics().lag)
                },
            })

            new Gauge({
                name: `${prefix}_staleness_ms`,
                help: 'Duration the active source has had a batch request outstanding (ms)',
                registers: [registry],
                collect() {
                    this.set(source.metrics().staleness)
                },
            })

            new Gauge({
                name: `${prefix}_chain_stalled`,
                help: 'Whether every source is stuck at the same head (1 = stalled)',
                registers: [registry],
                collect() {
                    this.set(source.metrics().chainStalled ? 1 : 0)
                },
            })

            new Gauge({
                name: `${prefix}_switches_total`,
                help: 'Cumulative number of fallback source switches',
                registers: [registry],
                collect() {
                    this.set(source.metrics().switchCount)
                },
            })
        },
    }
}
