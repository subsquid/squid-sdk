# PLAN.md — Remediation Plan for `evm-dump` SRE Acceptance Criteria

Based on findings in `SRE_REPORT.md` (2026-02-28). Issues ordered by severity and risk.

---

## Phase 1: Critical — Data Integrity & Availability

### 1.1 Graceful Shutdown (Score: 0/10)

**Risk:** SIGTERM on Kubernetes causes immediate process death → corrupted/partial S3 objects, orphaned archive chunks.

**Files to modify:**
- `util/util-internal-dump-cli/src/dumper.ts` — add SIGTERM/SIGINT handler in `run()`
- `util/util-internal-fs/src/s3.ts` — add `close()` method to drain pending S3 calls

**Steps:**
1. Add an `AbortController` to the base `Dumper` class, signalled on SIGTERM/SIGINT
2. Pass the abort signal into the `ingest()` async generator loop to stop fetching new blocks
3. After the loop exits, await all in-flight S3 `PutObject` calls (add a pending-writes counter in `S3Fs`)
4. Close the Prometheus HTTP server via its existing `stoppable` wrapper
5. Close the `RpcClient` (add a `close()` method that destroys the HTTP agent)
6. Log `info` on clean shutdown, `warn` if force-exit deadline (30s configurable) is reached
7. Exit with code 0 on clean shutdown

**Reusable pattern:** `waitForInterruption()` in `util/util-internal-http-server/src/server.ts`

### 1.2 Finite Retry Cap (Score: 4/10 — Retries)

**Risk:** `retryAttempts: Number.MAX_SAFE_INTEGER` means a dead RPC endpoint hangs the dumper forever. No alert, no escalation.

**Files to modify:**
- `util/util-internal-dump-cli/src/dumper.ts` — change `retryAttempts` default, add CLI flag
- `util/rpc-client/src/client.ts` — enforce max retries in `call()` / `batchCall()`

**Steps:**
1. Add `--max-retry-attempts <number>` CLI option (default: 50)
2. Replace `retryAttempts: Number.MAX_SAFE_INTEGER` with the configurable value
3. When retries exhausted, log at `error` level with structured context: `{ endpoint, method, totalAttempts, totalDuration_ms, lastError }`
4. Exit with non-zero code on exhausted retries

### 1.3 S3 Retry Logic

**Risk:** A single transient S3 error (503 SlowDown, network timeout) kills the entire process.

**Files to modify:**
- `util/util-internal-fs/src/s3.ts` — wrap `this.client.send(...)` with retry logic

**Steps:**
1. Add retry wrapper for all S3 operations: retry on 503, 500, network errors
2. Use exponential backoff: `[100, 500, 2000, 5000]` ms with jitter
3. Max 4 retries per operation
4. Move `EventEmitter.emit('S3FsOperation', ...)` to fire on both success (`status: 'success'`) and failure (`status: 'error'`), so metrics reflect reality
5. Add explicit S3 request timeout (configurable, default 60s for PutObject, 30s for others)

---

## Phase 2: High — Observability & Operability

### 2.1 Health Checks (Score: 0/10)

**Risk:** Kubernetes cannot detect failed/stuck dumper processes. No automatic restart on deadlock; no traffic gating on readiness.

**Files to modify:**
- `util/util-internal-prometheus-server/src/server.ts` — add health endpoints
- `util/util-internal-dump-cli/src/dumper.ts` — track startup/readiness state

**Steps:**
1. Add `/healthz` to Prometheus HTTP server — return 200 if event loop is responsive (no dependency checks)
2. Add `/readyz` — return 200 only after first block has been received (`sqd_latest_received_block_number > 0`) AND RPC connection is live
3. Add `/health/startup` — return 503 until RPC connection established and first block fetched, then 200 forever
4. Accept a readiness callback in `createPrometheusServer()` so the dumper can provide its own readiness logic

### 2.2 RPC Duration Histogram

**Risk:** Tail latency invisible. A 60s spike averages out to nothing in the current gauge.

**Files to modify:**
- `util/util-internal-dump-cli/src/prometheus.ts` — replace gauge with histogram
- `util/rpc-client/src/client.ts` — emit per-request duration (not cumulative average)

**Steps:**
1. Replace `sqd_chain_avg_response_time_seconds` (Gauge) with `sqd_chain_rpc_request_duration_seconds` (Histogram)
2. Use buckets: `[0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 180]`
3. Label by `url` (endpoint) and `method` (RPC method name)
4. Deprecate the old gauge name (keep for 1 release cycle with a deprecation comment)

### 2.3 Fix RPC Request Counter Type

**Files to modify:**
- `util/util-internal-dump-cli/src/prometheus.ts`

**Steps:**
1. Change `sqd_rpc_request_count` from Gauge to Counter
2. Label with `status_class` (success / rate_limited / server_error / network_error) instead of binary `kind`
3. Add `sqd_rpc_retry_attempts_total` Counter to track retry storms

### 2.4 Fix S3 Metrics

**Files to modify:**
- `util/util-internal-fs/src/s3.ts` — emit on success AND failure
- `util/util-internal-dump-cli/src/prometheus.ts` — add duration and bytes metrics

**Steps:**
1. Move `EventEmitter.emit()` to a `finally` block so it fires on both success and failure
2. Add status label: `success` / `error`
3. Add `sqd_s3_request_duration_seconds` Histogram (buckets: `[0.1, 0.5, 1, 2.5, 5, 10, 30, 60]`)
4. Add `sqd_s3_bytes_transferred_total` Counter with labels `operation` and `bucket`

---

## Phase 3: Medium — Resilience Hardening

### 3.1 Backoff Jitter

**Risk:** After RPC recovery, all instances retry at the same millisecond → thundering herd prolongs outage.

**Files to modify:**
- `util/rpc-client/src/client.ts` — `backoff()` method

**Steps:**
1. Add jitter to the backoff pause: `pause = scheduledPause * (0.5 + Math.random())`
2. This is a one-line change in the `backoff()` method

### 3.2 Configurable RPC Timeout

**Risk:** 180s hardcoded timeout can't be tuned for slow or fast networks.

**Files to modify:**
- `util/util-internal-dump-cli/src/dumper.ts` — add CLI option
- `evm/evm-dump/src/dumper.ts` — (no changes if base class handles it)

**Steps:**
1. Add `--rpc-timeout <ms>` CLI flag (default: 180000)
2. Pass to `RpcClient` constructor
3. Document that this is per-request, not total

### 3.3 S3 Timeout Configuration

**Files to modify:**
- `util/util-internal-fs/src/s3.ts` — add timeout to S3 client config

**Steps:**
1. Pass `requestTimeout` to the AWS SDK S3 client constructor
2. Add `--s3-timeout <ms>` CLI flag (default: 60000)

### 3.4 Failure Threshold Alerting (Lightweight Circuit Breaker)

**Risk:** No way to distinguish transient blips from permanent RPC outage in dashboards.

**Files to modify:**
- `util/rpc-client/src/client.ts`

**Steps:**
1. When `connectionErrorsInRow` exceeds a threshold (e.g., 50), log at `error` level: `"RPC endpoint may be permanently unavailable"` with `{ endpoint, consecutiveErrors, backoffPause_ms }`
2. Expose `sqd_rpc_consecutive_errors` Gauge so dashboards can alert on sustained failure
3. Full circuit breaker (closed/open/half-open) is not needed for a batch dumper

---

## Phase 4: Low — Cleanup & Polish

### 4.1 Fix Binary Name

**File:** `evm/evm-dump/package.json`

Change `"solana-dump"` → `"evm-dump"` in the `bin` field.

### 4.2 Structured Error Context on Fatal

**Files to modify:**
- `util/util-internal-dump-cli/src/dumper.ts` — enrich `log.fatal()` calls

**Steps:**
1. Wrap the top-level `try/catch` in `run()` to extract structured fields from the error:
   - If `HttpTimeoutError`: log `{ method, url, timeout_ms }`
   - If `HttpError`: log `{ method, url, status_code, duration_ms }`
   - If S3 error: log `{ operation, bucket, key }`
2. Fallback: log the raw error for unexpected types

### 4.3 Per-Retry Logging

**Files to modify:**
- `util/rpc-client/src/client.ts` — `backoff()` and request re-enqueue

**Steps:**
1. Log each retry attempt at `warn` level with `{ attempt, maxAttempts, method, endpoint, reason }`
2. Currently only logs once per backoff epoch — change to log each re-enqueue on lines 407-409

---

## Implementation Order

| Priority | Task | Est. Complexity | Shared Utility Impact |
|----------|------|-----------------|----------------------|
| P0 | 1.1 Graceful Shutdown | Medium | `util-internal-dump-cli`, `util-internal-fs` |
| P0 | 1.2 Finite Retry Cap | Low | `util-internal-dump-cli`, `rpc-client` |
| P0 | 1.3 S3 Retry Logic | Medium | `util-internal-fs` |
| P1 | 2.1 Health Checks | Low | `util-internal-prometheus-server` |
| P1 | 2.2 RPC Duration Histogram | Low | `util-internal-dump-cli`, `rpc-client` |
| P1 | 2.3 Fix RPC Counter Type | Low | `util-internal-dump-cli` |
| P1 | 2.4 Fix S3 Metrics | Low | `util-internal-fs`, `util-internal-dump-cli` |
| P2 | 3.1 Backoff Jitter | Trivial | `rpc-client` |
| P2 | 3.2 Configurable RPC Timeout | Low | `util-internal-dump-cli` |
| P2 | 3.3 S3 Timeout Config | Low | `util-internal-fs` |
| P2 | 3.4 Failure Threshold Alert | Low | `rpc-client` |
| P3 | 4.1 Fix Binary Name | Trivial | `evm-dump` only |
| P3 | 4.2 Structured Fatal Errors | Low | `util-internal-dump-cli` |
| P3 | 4.3 Per-Retry Logging | Low | `rpc-client` |

**Note:** Most changes are in shared `util/` packages, not in `evm-dump` itself. The same fixes will benefit `solana-dump` and any other service using these utilities.
