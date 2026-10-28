import type {ComponentsRule} from '@subsquid/util-internal-dump-stream'

/**
 * Dumper options, that decide what a raw block holds and which checks it passed
 */
export interface ComponentOptions {
    withReceipts?: boolean
    withTraces?: boolean
    withStatediffs?: boolean
    useTraceApi?: boolean
    useDebugApiForStatediffs?: boolean
    verifyBlockHash?: boolean
    verifyExtDataHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyWithdrawalsRoot?: boolean
    verifyLogsBloom?: boolean
    callFrameValidation?: string
    skipLogIndexCheck?: boolean
    skipCumulativeGasUsedCheck?: boolean
    useGasUsedForReceiptsRoot?: boolean
}

const KNOWN_NAMES: ReadonlySet<string> = new Set([
    'logs',
    'receipts',
    'traces',
    'statediffs',
    'trace-api',
    'debug-statediffs',
    // How the publisher has computed the receipts root, the dumper computes it in its own way
    'gas-used-receipts-root',
])

export function getComponentsRule(options: ComponentOptions): ComponentsRule {
    let exact = new Map<string, boolean>([
        ['logs', !options.withReceipts],
        ['receipts', !!options.withReceipts],
        ['traces', !!options.withTraces],
        ['statediffs', !!options.withStatediffs],
    ])

    // The API a part is fetched with decides its shape only when the part is there
    if (options.withTraces) {
        exact.set('trace-api', !!options.useTraceApi)
    }

    if (options.withStatediffs) {
        exact.set('debug-statediffs', !!options.useDebugApiForStatediffs)
    }

    return {
        known: KNOWN_NAMES,
        exact,
    }
}

/**
 * Parts of a block the header hash alone says nothing about.
 *
 * Each item is checked to be in order and to belong to this block, but its content and the set as a whole
 * are tied to the verified header only by a root, so without it a changed, dropped or added item goes unnoticed.
 *
 * @returns the missing verifications, each named by the options that turn it on
 */
export function findUnverifiedParts(options: ComponentOptions): string[] {
    let parts: string[] = []

    if (!options.verifyTxRoot) {
        parts.push('transactions (--verify-tx-root)')
    }

    // A logs bloom holds only addresses and topics, the data of a log is in the receipts root alone
    if (!options.withReceipts) {
        parts.push('logs (--with-receipts --verify-receipts-root)')
    } else if (!options.verifyReceiptsRoot) {
        parts.push('receipts and logs (--verify-receipts-root)')
    }

    return parts
}
