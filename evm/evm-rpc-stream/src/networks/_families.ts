import {RpcMethodOptions} from '../source/data-source'

import {RpcValidationOptions} from './types'

/**
 * Shared validation/method primitives reused by per-network presets ("modules may reuse modules").
 */

/** Full validation: block hash, tx sender, tx root, receipts root, logs bloom. */
export const standardValidation: RpcValidationOptions = {
    verifyBlockHash: true,
    verifyTxSender: true,
    verifyTxRoot: true,
    verifyReceiptsRoot: true,
    verifyLogsBloom: true,
}

/**
 * OP-stack networks serve state diffs via the debug `prestateTracer` (not
 * `trace_replayBlockTransactions`). Traces still use the default debug `callTracer`.
 */
export const opStackMethod: RpcMethodOptions = {
    useDebugApiForStateDiffs: true,
}
