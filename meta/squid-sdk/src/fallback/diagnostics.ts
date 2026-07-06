/**
 * Turning whatever a source throws into something usable by both logs and metrics. We rely on
 * sources *throwing* to detect incapability/unreachability, so the supervisor never knows the error
 * type up front — this normalizer duck-types the conventional fields the SDK already stamps on its
 * errors (`@subsquid/util-internal`'s `addErrorContext` puts `rpcUrl`/`rpcMethod`/`rpcParams` on a
 * thrown `RpcError`; `HttpError` carries `.response.{status,url,body}`; transport errors carry a
 * `name`) rather than importing every error class. The result splits cleanly:
 *
 *  - `reason` + `code` + `check` are bounded enums/numbers → safe as Prometheus labels.
 *  - `detail` (and the embedded, possibly large request) is for logs only — never a metric label.
 */

/** Which health check tripped — the leading "<…> failed" in the message. */
export type FailedCheck = 'stream' | 'liveness' | 'capability'

/** Coarse, bounded failure category. Kept small so it is safe as a metric label. */
export type FailureReason = 'http' | 'rpc' | 'timeout' | 'connection' | 'stale' | 'lag' | 'fork' | 'unknown'

export interface SourceErrorInfo {
    /** Which check failed. */
    check: FailedCheck
    /** Bounded error category — metric label. */
    reason: FailureReason
    /** HTTP status or JSON-RPC error code, when known — metric label. */
    code?: number
    /** Endpoint URL with credentials redacted — logs only, never a metric label. */
    endpoint?: string
    /** Full human-readable cause, incl. the request when available — logs only. */
    detail: string
}

/**
 * Strip credentials from a URL before it reaches a log line: drop userinfo + query string (where
 * `?apikey=…` lives) and mask key-like path segments (SQD `sqd_…` tokens and long opaque ids).
 * Returns `undefined` for an unparseable value rather than risk leaking it verbatim.
 */
export function redactUrl(u?: string): string | undefined {
    if (!u) return undefined
    try {
        let url = new URL(u)
        url.username = ''
        url.password = ''
        url.search = ''
        url.pathname = url.pathname
            .replace(/sqd_[A-Za-z0-9]+/g, 'sqd_***')
            .replace(/[A-Za-z0-9_-]{24,}/g, '***')
        return url.toString()
    } catch {
        return undefined
    }
}

/** Redact every URL embedded in free text — error messages routinely quote the failing URL. */
export function redactText(s: string): string {
    return s.replace(/https?:\/\/[^\s)'"]+/g, (m) => redactUrl(m) ?? '***')
}

function pickEndpoint(e: any): string | undefined {
    return redactUrl(e?.rpcUrl ?? e?.response?.url ?? e?.url)
}

function requestText(e: any): string | undefined {
    // RpcError is stamped with the offending call by `addErrorContext` (rpc-client).
    if (e?.rpcMethod) {
        let params = e.rpcParams === undefined ? '' : ` ${safeJson(e.rpcParams)}`
        return `${e.rpcMethod}${params}`
    }
    // HttpError carries only the server's *response* body, which still localizes the failure.
    let body = e?.response?.body
    if (body != null) return `response body: ${typeof body === 'string' ? body : safeJson(body)}`
    return undefined
}

function safeJson(v: unknown): string {
    try {
        let s = JSON.stringify(v)
        return s.length > 1000 ? s.slice(0, 1000) + '…' : s
    } catch {
        return String(v)
    }
}

/**
 * Classify an arbitrary thrown value into a {@link SourceErrorInfo}. `check` is supplied by the call
 * site (the error itself doesn't know which probe ran it).
 */
export function classifyError(check: FailedCheck, err: unknown): SourceErrorInfo {
    let e = err as any
    let endpoint = pickEndpoint(e)
    let request = requestText(e)
    let message = typeof e?.message === 'string' ? e.message : String(e)

    let reason: FailureReason = 'unknown'
    let code: number | undefined

    if (e?.name === 'HttpError' && typeof e?.response?.status === 'number') {
        reason = 'http'
        code = e.response.status
    } else if (e?.name === 'HttpTimeoutError' || /timed out/i.test(message)) {
        reason = 'timeout'
    } else if (e?.name === 'RpcConnectionError') {
        reason = 'connection'
    } else if ((e?.name === 'RpcError' || e?.name === 'RpcProtocolError') && typeof e?.code === 'number') {
        // A JSON-RPC error inside an HTTP 200 body surfaces here (e.g. trace/`debug_` disabled).
        reason = 'rpc'
        code = e.code
    } else if (e?.isSqdForkException) {
        reason = 'fork'
    }

    let head = `${check} check failed: ${reason}${code != null ? ` ${code}` : ''}`
    let detail = [head, endpoint && `from ${endpoint}`, message && `(${message})`, request && `request: ${request}`]
        .filter(Boolean)
        .join(', ')

    // Final safety net: the message (and, rarely, the request) can quote the failing URL verbatim,
    // so scrub credentials from the whole detail before it reaches a log line.
    return {check, reason, code, endpoint, detail: redactText(detail)}
}

/** Build a {@link SourceErrorInfo} for an internal freshness trip that has no thrown error. */
export function freshnessFailure(check: FailedCheck, reason: 'stale' | 'lag', detail: string): SourceErrorInfo {
    return {check, reason, detail: `${check} check failed: ${detail}`}
}

/**
 * Build a {@link SourceErrorInfo} for a capability probe that reported not-capable without a thrown,
 * classifiable error. The reason is never `stale`: a probe fails for non-freshness reasons — pruned
 * state, disabled `trace_`/`debug_` APIs (`unknown`), or a slice that outran the probe timeout
 * (`timeout`) — so a `stale` label would misreport it in logs and metrics.
 */
export function capabilityFailure(detail: string, reason: FailureReason = 'unknown'): SourceErrorInfo {
    return {check: 'capability', reason, detail: `capability check failed: ${detail}`}
}
