import type {RpcMethodOptions} from '../source/data-source'

import type {RpcValidationOptions} from './types'

/**
 * Shared validation/method primitives reused by per-network presets ("modules may reuse modules").
 */

/**
 * Full consensus validation plus shadow observation of call-frame consistency.
 *
 * Call frames have no consensus root, so semantic violations are logged first.
 * A network can move to `reject` only after the observations establish that its
 * tracer follows the checked invariants.
 */
export const standardValidation: RpcValidationOptions = {
    verifyBlockHash: true,
    verifyTxSender: true,
    verifyTxRoot: true,
    verifyReceiptsRoot: true,
    verifyLogsBloom: true,
    callFrameValidation: 'observe',
}

/**
 * OP-stack networks serve state diffs via the debug `prestateTracer` (not
 * `trace_replayBlockTransactions`). Traces still use the default debug `callTracer`.
 */
export const opStackMethod: RpcMethodOptions = {
    useDebugApiForStateDiffs: true,
}
