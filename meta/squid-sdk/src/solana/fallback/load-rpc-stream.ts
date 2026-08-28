const RPC_PEERS = ['@subsquid/solana-rpc', '@subsquid/solana-rpc-data', '@subsquid/solana-normalization']

/**
 * Load the sibling `solana/rpc` subpath lazily, only when an `rpc` source is actually built.
 *
 * `@subsquid/solana-rpc` and `@subsquid/solana-normalization` are *optional peer dependencies* of
 * `@subsquid/squid-sdk` — a Portal-only or non-Solana squid installs neither. The `solana/rpc`
 * code imports them at module scope, so deferring the `require` keeps the RPC stack out of the
 * module graph until an `rpc` source is configured, and lets us translate a missing peer into an
 * actionable message instead of a raw `MODULE_NOT_FOUND` thrown from deep inside the stack.
 */
export function loadRpcStream(): typeof import('../rpc/builder') {
    try {
        // Require the builder module directly (not the barrel) so we can reach the internal
        // `solanaRpcStream` construction primitive, which the barrel intentionally does not re-export.
        return require('../rpc/builder')
    } catch (e) {
        throw translateMissingRpcPeer(e)
    }
}

/**
 * If `e` is a `MODULE_NOT_FOUND` for one of the optional RPC peers, return an actionable error
 * naming both peers. Matches the missing module by its exact quoted name, so a `MODULE_NOT_FOUND`
 * for a *different* module (a broken install of a transitive dep) — and any non-`MODULE_NOT_FOUND`
 * fault thrown on load — passes through unchanged rather than being masked as "peers missing".
 */
export function translateMissingRpcPeer(e: unknown): unknown {
    let err = e as NodeJS.ErrnoException
    if (err?.code === 'MODULE_NOT_FOUND' && RPC_PEERS.some((p) => err.message.includes(`'${p}'`))) {
        return new Error(
            "An 'rpc' fallback source requires the optional peer dependencies '@subsquid/solana-rpc' " +
                "and '@subsquid/solana-normalization'. Install them, or use only 'portal' sources.",
        )
    }
    return err
}
