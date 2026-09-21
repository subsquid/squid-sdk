# Change Log - @subsquid/batch-processor

This log was last generated on Thu, 16 Jul 2026 19:47:53 GMT and should not be manually modified.

## 1.1.0
Thu, 16 Jul 2026 19:47:53 GMT

### Minor changes

- feat(run): auto-register a data source's own Prometheus metrics. If the source exposes an optional `getMetricsSink(): MetricsSink` (duck-typed, so the minimal DataSource interface keeps no prom-client dependency), `run()` adds it to the metrics server alongside the runner metrics — so source-provided gauges (e.g. a fallback source's `sqd_fallback_*`) appear on `/metrics` with no manual `addMetricsSink` wiring.

## 1.0.0
Mon, 11 May 2026 05:34:26 GMT

### Breaking changes

- use shared `DataSource` interfaces for finalized and unfinalized streams

### Minor changes

- add support for unfinalized data sources

## 0.1.0
Mon, 23 Mar 2026 13:12:51 GMT

### Minor changes

- allow to set optional custom PrometheusServer in run()

## 0.0.0
Wed, 17 Apr 2024 12:46:35 GMT

_Initial release_

