// Curated public surface of the `fallback` subpath. Internal machinery — the diagnostics
// redaction/classification helpers, the health tracker, the source selector, and the resolved-policy
// internals — is intentionally not re-exported here; reach it via relative imports inside the package.

// The supervisor and its construction API. The subpath is VM-agnostic: `FallbackDataSourceOptions` +
// `RankedSource` let you build a fallback over any chain's `DataSource`, not just EVM.
export {FallbackDataSource, type FallbackDataSourceOptions, type RankedSource, type FallbackMetrics} from './fallback'

// Failover policy, its default, and the all-sources-down error.
export {type FallbackPolicy, DEFAULT_POLICY, type Health, AllSourcesDownError} from './policy'

// The structured failure cause carried on `FallbackMetrics.sources[].cause`.
export {type SourceErrorInfo, type FailedCheck, type FailureReason} from './diagnostics'

// Capability-probe API — used when wiring sources directly (the EVM builder does this for you).
export {makeCapabilityProbe, type CapabilityProbeOptions, type ProbeResult} from './capability'

// Prometheus metrics sink (auto-registered by the batch-processor; see the README).
export {fallbackMetricsSink, type FallbackMetricsSource, type MetricsSink} from './metrics'
