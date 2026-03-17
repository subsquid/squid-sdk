---
name: product-acceptance-criteria
description: |
  **SRE Product Acceptance Criteria for AI-generated code**: Review and enforce production-readiness standards on code that AI (or humans) produce. Covers structured logging, metrics exposure, health checks, graceful shutdown, retry/circuit-breaker patterns, and timeout policies. Use this skill whenever reviewing code for production readiness, writing acceptance criteria for a service, auditing observability of an existing codebase, or when the user says things like "is this production ready", "add logging", "add metrics", "review for SRE", "acceptance criteria", "observability", "production checklist". Trigger even if the user just asks to "review this service" or "make this ready for prod" — those are exactly the moments this skill should activate.
---

# Product Acceptance Criteria — SRE Checklist for AI-Generated Code

You are reviewing code (or generating new code) that must meet production-readiness standards. Walk through each section below. For every criterion, either confirm the code already satisfies it, or produce the specific changes needed.

When generating new code or reviewing existing code, apply ALL sections. When the user asks about a specific area (e.g., "just check metrics"), focus there but mention other gaps you notice.

---

## 1. Structured Logging

Every log line must be machine-parseable (JSON or structured key-value). Human-readable "print" statements are not acceptable in production paths.

### 1.1 Error Context Requirements

Every error log MUST include enough context to reproduce or triage the issue without looking at other log lines. The goal: an on-call engineer reading a single log line at 3 AM should understand what happened, where, and what was involved.

**For HTTP/API errors (outbound calls):**

Required fields:
- `method` — HTTP method (GET, POST, etc.)
- `url` or `path` — the endpoint called (scrub sensitive query params)
- `status_code` — the HTTP status returned
- `duration_ms` — how long the call took
- `request_id` or `correlation_id` — for tracing across services
- `error_message` — the error description (truncate to reasonable length)
- `service` — which downstream service was called

**Example (good):**
```json
{
  "level": "error",
  "message": "downstream API call failed: POST /v1/charges returned 502",
  "service": "payment-gateway",
  "method": "POST",
  "path": "/v1/charges",
  "status_code": 502,
  "duration_ms": 3200,
  "request_id": "req_abc123",
  "error": "Bad Gateway",
  "retry_attempt": 2
}
```

**Example (bad — don't do this):**
```
ERROR: API call failed
```
This tells the on-call engineer nothing. Which API? What failed? What was the status? How long did it take?

**For database errors:**

Required fields: `operation` (SELECT/INSERT/UPDATE/DELETE), `table` or `collection`, `duration_ms`, `error_message`. Never log the full query with user data — log the query template or operation type.

**For S3 / object-storage errors:**

Required fields: `operation` (GetObject, PutObject, etc.), `bucket`, `key` (if not sensitive), `duration_ms`, `error_message`, `status_code`.

**For queue/message-broker errors:**

Required fields: `operation` (publish/consume), `queue` or `topic`, `message_id` (if available), `error_message`.

### 1.2 Log Levels

Use log levels consistently:
- `debug` — verbose development-time information, off in production by default
- `info` — normal operational events (startup, shutdown, config loaded, request served)
- `warn` — something unexpected that the system recovered from (retry succeeded, fallback used, deprecated feature called)
- `error` — something failed that needs attention (request failed, downstream timeout, data inconsistency)

Do not use `error` for expected conditions (e.g., 404 on a user-facing lookup is `warn` or `info`, not `error`).

### 1.3 Sensitive Data

Never log: passwords, tokens, API keys, credit card numbers, SSNs, or PII beyond what's needed for debugging. If you must log a user identifier, use an internal ID, not email/phone. Scrub Authorization headers — log their presence, not their value.

---

## 2. Metrics

If the service does work, that work must be measured. Metrics exist so you can answer "is this service healthy?" from a dashboard without reading logs.

### 2.1 External API / HTTP Client Metrics

Any code that calls an external API (HTTP client, gRPC client, etc.) MUST expose request counters classified by outcome:

**Classification scheme:**
| Status Code Range | Label        | Meaning                        |
|-------------------|--------------|--------------------------------|
| 2xx–3xx           | `success`    | Request completed normally     |
| 429               | `rate_limited` | Hit rate limit, should back off |
| 4xx (except 429)  | `client_error` | Our request was bad            |
| 5xx               | `server_error` | Downstream service failed      |
| timeout / conn err| `network_error`| Never got a response           |

**Required metrics for each external dependency:**

1. **Request counter** — incremented on every call, labeled by:
   - `service` (e.g., "payment-api", "user-service")
   - `method` (GET, POST, etc.)
   - `status_class` — one of the classification labels above

2. **Request duration** (histogram or summary) — labeled by `service` and `method`, so you can track latency percentiles.

**Example metric names** (adapt to your metrics system):
```
http_client_requests_total{service="payment-api", method="POST", status_class="success"}
http_client_requests_total{service="payment-api", method="POST", status_class="rate_limited"}
http_client_request_duration_seconds{service="payment-api", method="POST"}
```

### 2.2 S3 / Object Storage Metrics

Any code that interacts with S3 (or compatible object storage) MUST expose:

1. **Operation counter** — labeled by:
   - `operation` (GetObject, PutObject, DeleteObject, ListObjects, etc.)
   - `bucket`
   - `status_class` (success / client_error / server_error / network_error — same scheme as above)

2. **Operation duration** (histogram) — labeled by `operation` and `bucket`.

3. **Bytes transferred** (counter, when applicable) — labeled by `operation` and `bucket`. Track upload and download sizes for capacity planning.

**Example:**
```
s3_requests_total{operation="PutObject", bucket="user-uploads", status_class="success"}
s3_request_duration_seconds{operation="PutObject", bucket="user-uploads"}
s3_bytes_transferred_total{operation="PutObject", bucket="user-uploads"}
```

### 2.3 Database Metrics

If the service queries a database, expose:
- Query counter by `operation` (select/insert/update/delete) and `status` (success/error)
- Query duration histogram by `operation`
- Connection pool metrics (active, idle, waiting) if using a pool

### 2.4 Queue / Message Broker Metrics

If the service produces or consumes messages:
- Messages published/consumed counter by `topic` and `status`
- Processing duration histogram
- Consumer lag (if applicable)

### 2.5 Business Metrics

Expose counters for key business events (user signups, orders placed, payments processed). These often matter more than infrastructure metrics for understanding service health in context.

---

## 3. Health Checks

### 3.1 Liveness (`/healthz` or `/health/live`)

Returns 200 if the process is running and not deadlocked. This should be cheap — no dependency checks. If this fails, the orchestrator should restart the process.

### 3.2 Readiness (`/health/ready` or `/readyz`)

Returns 200 only if the service can handle traffic. Checks that critical dependencies are reachable (database connected, required caches warm, etc.). If this fails, the load balancer should stop sending traffic but NOT restart the process — it might recover.

### 3.3 Startup (`/health/startup`)

For services with slow initialization (loading ML models, warming caches), expose a startup probe. Returns 503 until the service is fully initialized, then 200 forever after. This prevents premature liveness-check kills during startup.

---

## 4. Graceful Shutdown

When the service receives SIGTERM:

1. Stop accepting new requests (close listeners / deregister from service discovery)
2. Finish in-flight requests (with a deadline — e.g., 30 seconds)
3. Close connections to dependencies (DB pools, message consumers, HTTP clients)
4. Flush buffered data (logs, metrics, traces)
5. Exit with code 0

If the deadline expires before in-flight work completes, force-exit. Log at `warn` level when force-exiting with the count of abandoned requests.

The shutdown timeout should be configurable and shorter than the orchestrator's kill grace period (so the service gets a chance to clean up before SIGKILL).

---

## 5. Retry Policies

### 5.1 When to Retry

Retry only on transient failures:
- 5xx responses (server errors — the downstream might recover)
- 429 responses (rate limited — back off and try again)
- Network errors (timeout, connection reset, DNS failure)

Never retry on:
- 4xx (except 429) — our request is wrong, retrying won't help
- Non-idempotent operations without an idempotency key

### 5.2 How to Retry

- **Exponential backoff** with jitter. Fixed delays cause thundering herds. The jitter is not optional — without it, all instances retry at the same time after an outage.
- **Max retries** — cap at 3-5 attempts. More than that and you're just adding latency.
- **Total timeout** — bound the total time including all retries. A request that takes 60 seconds of retries is worse than a fast failure.
- **Log each retry** at `warn` level with the attempt number and reason.
- **Track retries in metrics** — increment a retry counter, and include `retry_attempt` as a label or field so you can see retry storms.

### 5.3 Idempotency

For non-idempotent operations (POST creating a resource, payment charges), either:
- Use an idempotency key in the request header, or
- Don't retry at all

Document which operations are retried and which are not.

---

## 6. Circuit Breakers

When a downstream dependency starts failing consistently, stop calling it. This prevents cascade failures and gives the downstream time to recover.

### 6.1 Required Behavior

- **Closed** (normal): requests flow through. Track failure rate.
- **Open** (tripped): requests fail immediately without calling downstream. Return a degraded response or cached value if possible.
- **Half-open** (probing): after a cooldown period, allow a small number of requests through. If they succeed, close the circuit. If they fail, re-open.

### 6.2 Configuration

These should be configurable (environment variables or config file):
- Failure threshold to trip (e.g., 50% failure rate over 10 requests)
- Cooldown period before half-open (e.g., 30 seconds)
- Number of probe requests in half-open (e.g., 3)

### 6.3 Observability

- Expose circuit state as a metric (gauge: 0=closed, 1=half-open, 2=open)
- Log state transitions at `warn` level (circuit opened, circuit closed)
- When circuit is open, the fast-fail response should be distinguishable from a normal error in metrics (label: `circuit_open`)

---

## 7. Timeouts

Every external call MUST have a timeout. "Hanging forever" is not an acceptable failure mode.

### 7.1 Defaults

- HTTP client calls: 5–30 seconds depending on the operation
- Database queries: 5–15 seconds
- S3 operations: 10–60 seconds depending on object size
- Queue publish: 5 seconds
- DNS resolution: 2 seconds (if configurable)

### 7.2 Configuration

Timeouts should be configurable per-dependency, not hardcoded. Use environment variables or a config file. Name them clearly (e.g., `PAYMENT_API_TIMEOUT_MS=5000`, not `TIMEOUT=5`).

### 7.3 Timeout Hierarchy

If a request handler has a total deadline (e.g., 30 seconds), individual downstream call timeouts must be shorter than the total. If you make 3 sequential calls with 30-second timeouts each, your handler can take 90 seconds — that's a bug.

Use a request-scoped deadline that propagates to all downstream calls (e.g., Go's `context.Context`, or manually tracking remaining time).

---

## 8. Review Checklist (Summary)

When reviewing code, walk through this list:

- [ ] All error logs include context (see Section 1.1 for required fields per error type)
- [ ] Log levels are used correctly (errors vs warnings vs info)
- [ ] No sensitive data in logs
- [ ] External API calls have request counters with status classification
- [ ] External API calls have duration histograms
- [ ] S3 operations have request counters, duration, and bytes metrics
- [ ] Database operations have query counters and duration metrics
- [ ] Liveness and readiness health checks exist
- [ ] Graceful shutdown handles SIGTERM properly
- [ ] Retry policy uses exponential backoff with jitter
- [ ] Non-idempotent operations are not retried (or use idempotency keys)
- [ ] Circuit breakers protect against cascade failures
- [ ] Every external call has a configurable timeout
- [ ] Timeout hierarchy is consistent (individual < total)

---

## Language-Specific Guidance

For implementation patterns in specific languages, read the appropriate reference file:

- **Python** (FastAPI, Flask, aiohttp, boto3): Read `references/python.md`
- **Node.js** (Express, AWS SDK, axios/got): Read `references/nodejs.md`
- **Rust** (axum, reqwest, aws-sdk-rust): Read `references/rust.md`

These contain idiomatic code patterns, recommended libraries, and common pitfalls for each platform.
