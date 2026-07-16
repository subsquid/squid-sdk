import type {MetricsSink} from '@subsquid/util-internal-processor-tools'
import {Gauge, Registry} from 'prom-client'

import type {FallbackMetrics} from './fallback'

export interface FallbackMetricsSource {
    metrics(): FallbackMetrics
}

// Re-export the processor's canonical `MetricsSink` (rather than a local duplicate that could drift):
// a `fallbackMetricsSink` plugs straight into the processor's `PrometheusServer` via `addMetricsSink`.
// Imported as a *type*, so the VM-agnostic fallback module gains no runtime dependency on
// processor-tools — the import is erased at build.
export type {MetricsSink}

const HEALTH_STATES = ['healthy', 'unhealthy', 'unknown'] as const

/**
 * A `MetricsSink` exporting a {@link FallbackDataSource}'s observable state as Prometheus gauges
 * (unhealthiness reflected in metrics): which source is active, per-source trinary health,
 * lag/staleness/chain-stalled, and the cumulative switch count. Each gauge reads `source.metrics()`
 * on scrape via prom-client's `collect`, so there is nothing to push.
 */
export function fallbackMetricsSink(source: FallbackMetricsSource, prefix = 'sqd_fallback'): MetricsSink {
    return {
        register(registry: Registry) {
            // Idempotent: the batch-processor auto-registers this sink, so a leftover manual
            // `addMetricsSink(fallbackMetricsSink(src))` would otherwise double-register and prom-client
            // would throw on the duplicate gauge name. Registering the same source twice is a no-op.
            if (registry.getSingleMetric(`${prefix}_active`)) return

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
                help:
                    'Per-source trinary health (1 for the current state, 0 otherwise). The unhealthy ' +
                    'row carries the cause as `check`/`reason`/`code` labels (empty otherwise); the ' +
                    'full detail incl. the request is in logs, never a label.',
                labelNames: ['source', 'state', 'check', 'reason', 'code'],
                registers: [registry],
                collect() {
                    // Reset so a previous scrape's cause labels (e.g. an old `code`) don't linger as
                    // stale series once the source recovers or fails for a different reason.
                    this.reset()
                    for (let s of source.metrics().sources) {
                        for (let state of HEALTH_STATES) {
                            // Only the current, unhealthy state row gets cause labels.
                            let c = state === 'unhealthy' ? s.cause : undefined
                            this.set(
                                {
                                    source: s.name,
                                    state,
                                    check: c?.check ?? '',
                                    reason: c?.reason ?? '',
                                    code: c?.code != null ? String(c.code) : '',
                                },
                                s.health === state ? 1 : 0,
                            )
                        }
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

            // Gauge, not Counter (set to an absolute snapshot on scrape), so it carries no
            // `_total` suffix — that suffix is reserved for Counters by Prometheus convention.
            new Gauge({
                name: `${prefix}_switches`,
                help: 'Cumulative number of fallback source switches',
                registers: [registry],
                collect() {
                    this.set(source.metrics().switchCount)
                },
            })
        },
    }
}
