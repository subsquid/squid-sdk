/**
 * Remove credentials from an RPC endpoint before it is included in logs,
 * metrics, or error context.
 *
 * The query and fragment are dropped because providers commonly put API keys
 * there. Key-like path segments are masked while ordinary routing components
 * remain visible so operators can still identify the endpoint.
 */
export function redactRpcUrl(url: string): string {
    let u = new URL(url)
    u.password = ''
    u.username = ''
    u.search = ''
    u.hash = ''
    u.pathname = u.pathname
        .replace(/sqd_[A-Za-z0-9]+/g, 'sqd_***')
        .replace(/[A-Za-z0-9_-]{24,}/g, '***')
    return u.toString()
}


const URL_IN_TEXT = /(?:https?|wss?):\/\/[^\s"'<>()\[\]{},;]+/gi


/**
 * Redact every URL occurring in a free-form text via {@link redactRpcUrl}.
 *
 * Transport errors routinely quote the request URL verbatim (e.g. node-fetch's
 * `FetchError: request to <url> failed`), so any error text destined for a log
 * line must pass through here. A URL that fails to parse is masked entirely
 * rather than risk leaking it.
 */
export function redactRpcUrlsInText(text: string): string {
    return text.replace(URL_IN_TEXT, match => {
        try {
            return redactRpcUrl(match)
        } catch {
            return '***'
        }
    })
}


/**
 * Scrub URLs from an error's `message` and `stack` in place and return it.
 *
 * The stack's first line repeats the message, so both must be rewritten.
 * Scrubbing failures (e.g. getter-only properties on exotic error objects)
 * are swallowed — a redaction problem must never mask the original error.
 */
export function redactRpcUrlsInError<T>(err: T): T {
    if (err instanceof Error) {
        try {
            err.message = redactRpcUrlsInText(err.message)
            if (typeof err.stack == 'string') {
                err.stack = redactRpcUrlsInText(err.stack)
            }
        } catch {}
    }
    return err
}
