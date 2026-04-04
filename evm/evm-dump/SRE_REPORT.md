# SRE Product Acceptance Criteria Review: `evm/evm-dump`

**Date:** 2026-02-28
**Service:** `@subsquid/evm-dump` — Data archiving tool for EVM-based chains
**Key files reviewed:**
- `evm/evm-dump/src/dumper.ts` — EVM-specific dumper implementation
- `evm/evm-dump/src/main.ts` — Entry point
- `evm/evm-dump/package.json` — Package manifest (note: `bin` field says `"solana-dump"` — copy-paste bug)
- `util/util-internal-dump-cli/src/dumper.ts` — Base `Dumper` class
- `util/util-internal-dump-cli/src/prometheus.ts` — Prometheus metrics
- `util/rpc-client/src/client.ts` — RPC client with retry logic
- `util/util-internal-fs/src/s3.ts` — S3 filesystem abstraction
- `util/util-internal/src/misc.ts` — `runProgram` execution wrapper
- `util/util-internal-prometheus-server/src/server.ts` — Prometheus HTTP server (only `/metrics` routes)

---

## Miscellaneous Bugs

- **Binary name mismatch in `package.json`:** The `bin` field declares `"solana-dump": "./bin/run.js"` but this is the EVM dump package. Should be `"evm-dump"`.

---

## 1. Structured Logging

| Criterion | Status | Details |
|-----------|--------|---------|
| Machine-parseable logs | **PASS** | Uses `@subsquid/logger` with structured output (`sqd:evm-dump` namespace) |
| Error context (Section 1.1) | **FAIL** | Terminal errors caught by `runProgram` are logged via `log.fatal(err)` — a raw error object without structured context fields (`method`, `url`, `status_code`, `duration_ms`) |
| Log levels used correctly | **PARTIAL** | `debug` for cache/block ops, `info` for progress, `warn` for missing timestamps, `fatal` for crashes. No `error`-level logs exist — every failure is terminal (`fatal` + `process.exit(1)`) |
| No sensitive data in logs | **PASS** | `RpcClient` constructor strips credentials from URL via `trimCredentials()` before logging. No tokens/keys logged |

### Gaps

- **RPC terminal errors lack structured context.** When a fatal RPC error propagates up, it is logged as `log.fatal(err)` in `dumper.ts:run()`. An on-call engineer sees something like `fatal: HttpTimeoutError: request timed out` without knowing which RPC method, which endpoint, how long it waited, or which block range was being fetched.
- **S3 errors have zero structured context.** An S3 `PutObject` failure surfaces as a raw AWS SDK error without `operation`, `bucket`, `key`, or `duration_ms`.
- **RPC client does log connection failures at `warn`.** The `backoff()` method in `rpc-client/src/client.ts:459-473` logs `{reason, httpResponseBody, rpcCall}` and the backoff pause duration. However, this log fires once per backoff epoch (not per individual request retry), and does not include a retry attempt number. This makes it hard to distinguish "occasional retries" from "retry storm."

---

## 2. Metrics

| Criterion | Status | Details |
|-----------|--------|---------|
| RPC request counter with status classification | **PARTIAL** | `sqd_rpc_request_count` is a **Gauge** (not Counter) with labels `url` and `kind` (`'success'`/`'failure'`). Does NOT classify by granular status (rate_limited / client_error / server_error / network_error). Using a Gauge for a monotonically increasing count means resets are possible |
| RPC request duration histogram | **FAIL** | `sqd_chain_avg_response_time_seconds` is a **Gauge of the cumulative average** (`totalResponseTime / requestsServed`). Not a histogram — no percentile data (p50/p95/p99). Latency spikes are invisible |
| S3 operation counter | **PARTIAL** | `sqd_s3_request_count` (Counter, label `kind`) tracks invocations by operation type (`PutObject`, `ListObjectsV2`, `DeleteObjects`, `GetObject`). Event is emitted **after** the S3 call succeeds — failed calls are not counted at all |
| S3 operation duration | **FAIL** | No duration tracking for S3 operations |
| S3 bytes transferred | **FAIL** | No bytes metric for S3 uploads/downloads |
| S3 error classification | **FAIL** | S3 counter only fires on success (event emitted after `await client.send(...)` returns). Failures throw before the emit, so they are invisible in metrics |
| Business metrics | **PASS** | Good coverage: `sqd_dump_chain_height`, `sqd_dump_last_written_block`, `sqd_blocks_delivery_delay`, `sqd_blocks_processing_time`, block number/timestamp tracking |

### Gaps

- **RPC duration must be a histogram.** The current averaged gauge hides tail latency entirely. A single 60s spike in a stream of 50ms calls averages out to nothing.
- **`sqd_rpc_request_count` should be a Counter, not a Gauge.** Counters are designed for monotonically increasing values and work correctly with `rate()` in Prometheus. The current Gauge-with-`collect()` pattern resets the entire metric on every scrape via `rpc.getMetrics()`.
- **S3 metrics only count successes.** The `EventEmitter.emit('S3FsOperation', ...)` call is placed after `await this.client.send(...)` in `s3.ts`. If the S3 call throws, the emit never fires. There is no way to detect S3 failures via metrics.
- **No retry metric.** There is no counter for RPC retry attempts, making retry storms invisible in dashboards.

---

## 3. Health Checks

| Criterion | Status | Details |
|-----------|--------|---------|
| Liveness (`/healthz`) | **FAIL** | No liveness endpoint. `createPrometheusServer()` only registers `/metrics` and `/metrics/{name}` routes |
| Readiness (`/readyz`) | **FAIL** | No readiness endpoint. No way to know if the dumper has started processing blocks |
| Startup probe | **FAIL** | No startup endpoint. The dumper may take significant time to connect to RPC and fetch the first block |

### Gaps

The Prometheus HTTP server (`util/util-internal-prometheus-server/src/server.ts`) is the only HTTP surface. It creates an `HttpApp` with only `/metrics` and `/metrics/{name}`. Adding `/healthz` (return 200 if process alive), `/readyz` (return 200 if `sqd_latest_received_block_number > 0`), and `/health/startup` on the same server would be straightforward.

---

## 4. Graceful Shutdown

| Criterion | Status | Details |
|-----------|--------|---------|
| SIGTERM handler | **FAIL** | No signal handlers registered. `runProgram()` (`misc.ts:27-43`) only wraps `main().then(() => process.exit(0), onerror)` |
| Stop accepting new work | **FAIL** | No mechanism to signal the `ingest()` async generator to stop yielding |
| Finish in-flight work | **FAIL** | No draining of in-flight S3 writes or RPC calls |
| Close connections | **FAIL** | `RpcClient`, `S3Client`, and Prometheus `ListeningServer` are never explicitly closed |
| Flush buffered data | **FAIL** | No log/metric flush on exit |
| Exit code 0 on clean shutdown | **FAIL** | `process.exit(1)` on any error; `process.exit(0)` only on natural range completion |

### Gaps

**This is the most critical gap.** On SIGTERM (e.g., Kubernetes pod termination):

1. The process receives SIGTERM but has no handler — Node.js default behavior terminates the process
2. In-flight S3 `PutObject` calls may leave partial/corrupted objects in the archive
3. The Prometheus `ListeningServer` is not closed (the `stoppable` wrapper with 5s grace in `util-internal-http-server` is never invoked)
4. No log line indicates shutdown was requested or completed
5. `ArchiveLayout` may have a partially written chunk with no cleanup

The codebase already has a reusable pattern in `util/util-internal-http-server/src/server.ts`:
```typescript
export function waitForInterruption(server: ListeningServer): Promise<void> {
    return new Promise((resolve, reject) => {
        function terminate() {
            process.off('SIGINT', terminate)
            process.off('SIGTERM', terminate)
            server.close().then(resolve, reject)
        }
        process.on('SIGINT', terminate)
        process.on('SIGTERM', terminate)
    })
}
```

---

## 5. Retry Policies

| Criterion | Status | Details |
|-----------|--------|---------|
| Retry on transient failures | **PASS** | RPC client retries on 429, 408, 502, 503, 504, `HttpTimeoutError`, `HttpConnectionError`, `RpcConnectionError`, `RetryError`, rate-limit and timeout error messages |
| Don't retry on 4xx (except 429, 408) | **PASS** | Other client errors are not classified as connection errors and are not retried |
| Exponential backoff | **PASS** | Fixed schedule `[10, 100, 500, 2000, 10000, 20000]` ms indexed by `connectionErrorsInRow`, ceiling at 20s. Resets to 0 on first success |
| Jitter | **FAIL** | No jitter/randomization in backoff. Pause is selected deterministically from the schedule array. All instances with the same error count retry at the exact same interval |
| Max retries capped | **FAIL** | Dumper sets `retryAttempts: Number.MAX_SAFE_INTEGER` (`dumper.ts:rpc()`). The service will retry **forever** on a dead endpoint |
| Total timeout bound | **FAIL** | No total deadline across retries. Effective timeout is infinite |
| Log each retry | **PARTIAL** | The `backoff()` method (`client.ts:459-473`) logs at `warn` with `{reason, httpResponseBody, rpcCall}` and backoff duration. But: (a) only fires once per backoff epoch, not per individual request retry, (b) does not include attempt number or max attempts, (c) re-enqueued requests on lines 407-409 are silent |
| Retry metrics | **FAIL** | `connectionErrors` is a cumulative total exposed via `getMetrics()`. No dedicated retry counter. Cannot distinguish "1 request retried 100 times" from "100 requests each failed once" |

### Gaps

- **Infinite retries is the most dangerous issue.** A permanently dead RPC endpoint causes the dumper to hang forever. The `backoff()` warn logs will fire repeatedly (every 20s at ceiling), but there is no escalation, no error-level alert, and no way to auto-recover.
- **No jitter** means after a brief RPC outage, all dumper instances sharing the same endpoint retry at the same millisecond, creating a thundering herd that can prolong the outage.
- **S3 has NO retry logic at all.** The `S3Fs` class (`s3.ts`) calls `this.client.send(...)` with no try/catch, no retry wrapper, and no backoff. A single transient S3 error (e.g., 503 SlowDown) kills the entire dumper process.

---

## 6. Circuit Breakers

| Criterion | Status | Details |
|-----------|--------|---------|
| Circuit breaker for RPC | **FAIL** | Not implemented. `connectionErrorsInRow` is tracked (`client.ts:121`) but only used to index into the backoff schedule, never to trip a circuit |
| Circuit breaker for S3 | **FAIL** | Not implemented |
| State exposed as metric | **FAIL** | N/A |

**Recommendation:** For a batch data dumper, a full circuit breaker (closed/open/half-open) may be overkill since there's no degraded-response path. However, a **failure threshold that triggers `log.error` + a metric** (e.g., "50 consecutive RPC failures — endpoint may be permanently down") would be valuable for alerting and distinguishing transient blips from real outages.

---

## 7. Timeouts

| Criterion | Status | Details |
|-----------|--------|---------|
| RPC request timeout | **PASS** | `requestTimeout: 180_000` (3 minutes) set in `Dumper.rpc()` |
| RPC timeout configurable | **FAIL** | Hardcoded in base `Dumper` class. Not exposed as a CLI flag or environment variable |
| S3 timeout configured | **FAIL** | No explicit timeout on S3 operations. Relies on AWS SDK defaults (which may be very long or uncapped for large objects) |
| Timeout hierarchy consistent | **FAIL** | Individual RPC calls timeout at 3 min, but infinite retries mean effective timeout is unbounded. No total-operation deadline exists |

---

## Summary Scorecard

| Section | Score | Critical Issues |
|---------|-------|-----------------|
| 1. Structured Logging | 4/10 | Fatal error logs lack context fields for triage |
| 2. Metrics | 4/10 | RPC duration is averaged gauge not histogram; S3 only counts successes; request count is a Gauge not Counter |
| 3. Health Checks | 0/10 | None exist |
| 4. Graceful Shutdown | 0/10 | No SIGTERM handling; risk of corrupted S3 archives |
| 5. Retry Policies | 4/10 | Infinite retries, no jitter, no per-request retry logging; S3 has zero retries |
| 6. Circuit Breakers | 0/10 | Not implemented (acceptable for batch workload if alerting exists — it doesn't) |
| 7. Timeouts | 3/10 | RPC timeout hardcoded; S3 has none; no total deadline |

---

## Top 5 Priorities (by risk)

1. **Graceful shutdown** — Add SIGTERM/SIGINT handlers to prevent corrupted S3 archives on pod termination. Reuse the `waitForInterruption` pattern from `util-internal-http-server`.
2. **Finite retry cap** — Replace `retryAttempts: Number.MAX_SAFE_INTEGER` with a configurable limit (e.g., `--max-retry-attempts 50`). Log at `error` level when retries are exhausted.
3. **Health checks** — Add `/healthz` and `/readyz` endpoints to the Prometheus HTTP server in `createPrometheusServer()`.
4. **S3 resilience** — Add retry-with-backoff for transient S3 errors (503, network errors). Move the `EventEmitter.emit()` call to fire on both success and failure with a status label so failures appear in metrics.
5. **RPC duration histogram** — Replace `sqd_chain_avg_response_time_seconds` (Gauge) with a proper `Histogram` to expose p50/p95/p99 latency percentiles.
