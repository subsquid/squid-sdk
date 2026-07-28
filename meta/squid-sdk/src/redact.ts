import {redactRpcUrl} from '@subsquid/rpc-client'

/**
 * Strip credentials from a URL before it reaches a log line: drop userinfo, query string (where
 * `?apikey=…` lives) and the fragment (`#…`, which can carry a token too), and mask key-like path
 * segments (SQD `sqd_…` tokens and long opaque ids). Returns `undefined` for an unparseable value
 * rather than risk leaking it verbatim.
 *
 * Shared by the fallback diagnostics and the RPC source's parity warning: any log line that quotes a
 * provider endpoint must pass through here, since RPC URLs routinely embed API keys in the path or
 * query string.
 */
export function redactUrl(u?: string): string | undefined {
    if (!u) return undefined
    try {
        return redactRpcUrl(u)
    } catch {
        return undefined
    }
}
