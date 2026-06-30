import {DataSource, isForkException} from '@subsquid/util-internal-data-source'

export interface CapabilityProbeOptions {
    /** Report not-capable if a single-block slice stays outstanding longer than this. Default 30s. */
    timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 30_000

/**
 * Build a generic `probeCapability` for any `DataSource<B>`. It fetches a one-block slice of
 * *exactly the data the source is configured to serve* — the query (fields + requests) is baked
 * into the source, so a bounded `getStream({from: atBlock, to: atBlock})` re-exercises the whole
 * pipeline — at the block the supervisor asks for, and reports whether the source could serve it.
 *
 * This catches the reachable-but-incapable failures liveness alone misses: an RPC node with the
 * trace/`debug_` API disabled, pruned state at that depth, or missing receipts fails the slice.
 * Because the supervisor anchors `atBlock` to the indexing frontier (not the chain tip), the probe
 * verifies capability *at the depth the source is about to read in bulk* during a backfill.
 *
 * Capable iff the slice yields a batch or completes without a non-fork error. A `ForkException`
 * counts as capable — the source served data and detected a reorg, a chain event rather than an
 * inability to serve. Any other error, or exceeding `timeoutMs`, reports not-capable.
 */
export function makeCapabilityProbe<B>(
    source: DataSource<B>,
    options: CapabilityProbeOptions = {},
): (atBlock: number) => Promise<boolean> {
    let timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    return async (atBlock: number): Promise<boolean> => {
        let iterator = source.getStream({from: atBlock, to: atBlock})[Symbol.asyncIterator]()
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
            let next = iterator.next()
            next.catch(() => {}) // a late rejection after a timeout must not surface as unhandled
            let timeout = new Promise<never>((_resolve, reject) => {
                timer = setTimeout(() => reject(new Error('capability probe timed out')), timeoutMs)
            })

            // One batch (or a clean stream end) is enough: it proves the source served the slice.
            await Promise.race([next, timeout])

            return true
        } catch (e) {
            return isForkException(e)
        } finally {
            if (timer) clearTimeout(timer)
            // Don't await: closing the probe stream must not block, and a stalled source's
            // `return()` can hang on the same unresolved fetch.
            try {
                iterator.return?.()?.then(
                    () => {},
                    () => {},
                )
            } catch {
                /* ignore */
            }
        }
    }
}
