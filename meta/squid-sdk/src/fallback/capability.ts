import {DataSource, isForkException} from '@subsquid/util-internal-data-source'

import {SourceErrorInfo, capabilityFailure, classifyError} from './diagnostics'

export interface CapabilityProbeOptions {
    /** Report not-capable if a single-block slice stays outstanding longer than this. Default 30s. */
    timeoutMs?: number
}

/** A capability probe's verdict: `ok`, plus *why* it failed (for logs + metrics) when it didn't. */
export interface ProbeResult {
    ok: boolean
    cause?: SourceErrorInfo
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
 * inability to serve. Any other error, or exceeding `timeoutMs`, reports not-capable, with the
 * cause (classified for logs + metrics) attached.
 */
export function makeCapabilityProbe<B>(
    source: DataSource<B>,
    options: CapabilityProbeOptions = {},
): (atBlock: number) => Promise<ProbeResult> {
    let timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

    return async (atBlock: number): Promise<ProbeResult> => {
        let iterator = source.getStream({from: atBlock, to: atBlock})[Symbol.asyncIterator]()
        let timer: ReturnType<typeof setTimeout> | undefined
        try {
            let next = iterator.next()
            next.catch(() => {}) // a late rejection after a timeout must not surface as unhandled
            let timeout = new Promise<never>((_resolve, reject) => {
                timer = setTimeout(
                    () => reject(capabilityFailure(`probe timed out after ${timeoutMs}ms`, 'timeout')),
                    timeoutMs,
                )
            })

            // One batch (or a clean stream end) is enough: it proves the source served the slice.
            await Promise.race([next, timeout])

            return {ok: true}
        } catch (e) {
            if (isForkException(e)) return {ok: true}
            // The timeout rejects with a ready-made cause; a thrown error gets classified.
            let cause = isErrorInfo(e) ? e : classifyError('capability', e)
            return {ok: false, cause}
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

function isErrorInfo(e: unknown): e is SourceErrorInfo {
    return typeof e === 'object' && e != null && 'reason' in e && 'check' in e
}
