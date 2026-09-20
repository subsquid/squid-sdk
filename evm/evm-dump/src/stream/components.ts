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

export interface ComponentsRule {
    /**
     * Name -> whether it is in the tag. Most of these decide the shape of a block, so both ways are strict.
     */
    exact: Map<string, boolean>
    /**
     * Verifications the dumper would have made itself
     */
    required: string[]
    /**
     * Checks the dumper makes and the publisher has skipped
     */
    forbidden: string[]
}

export function getComponentsRule(options: ComponentOptions): ComponentsRule {
    let exact = new Map<string, boolean>([
        ['logs', !options.withReceipts],
        ['receipts', !!options.withReceipts],
        ['traces', !!options.withTraces],
        ['statediffs', !!options.withStatediffs],
        ['trace-api', !!options.useTraceApi],
        ['debug-statediffs', !!options.useDebugApiForStatediffs],
        ['gas-used-receipts-root', !!options.useGasUsedForReceiptsRoot],
    ])

    let verifications: [name: string, on: boolean][] = [
        ['v-block-hash', !!options.verifyBlockHash],
        ['v-ext-data-hash', !!options.verifyExtDataHash],
        ['v-tx-sender', !!options.verifyTxSender],
        ['v-tx-root', !!options.verifyTxRoot],
        ['v-receipts-root', !!options.verifyReceiptsRoot],
        ['v-withdrawals-root', !!options.verifyWithdrawalsRoot],
        ['v-logs-bloom', !!options.verifyLogsBloom],
        ['v-call-frames', options.callFrameValidation == 'reject'],
    ]

    let skips: [name: string, skipped: boolean][] = [
        ['no-log-index-check', !!options.skipLogIndexCheck],
        ['no-cumulative-gas-check', !!options.skipCumulativeGasUsedCheck],
    ]

    return {
        exact,
        required: verifications.filter((v) => v[1]).map((v) => v[0]),
        forbidden: skips.filter((s) => !s[1]).map((s) => s[0]),
    }
}

/**
 * Parts of a block the header hash alone says nothing about.
 *
 * Each item is checked to be in order and to belong to this block, but the set as a whole is tied
 * to the verified header only by a root or a bloom, so without them a dropped or added tail goes unnoticed.
 *
 * @returns the missing verifications, each named by the option that turns it on
 */
export function findUnverifiedParts(options: ComponentOptions): string[] {
    let parts: string[] = []

    if (!options.verifyTxRoot) {
        parts.push('transactions (--verify-tx-root)')
    }

    if (options.withReceipts && !options.verifyReceiptsRoot) {
        parts.push('receipts (--verify-receipts-root)')
    }

    // In the receipts mode logs are covered by the receipts root as well
    let isLogsCovered = options.verifyLogsBloom || (!!options.withReceipts && !!options.verifyReceiptsRoot)
    if (!isLogsCovered) {
        parts.push('logs (--verify-logs-bloom)')
    }

    return parts
}

// A name outside of this set may change the shape of a block in a way this reader knows nothing about
const KNOWN_NAMES: ReadonlySet<string> = new Set([
    'logs',
    'receipts',
    'traces',
    'statediffs',
    'trace-api',
    'debug-statediffs',
    'v-block-hash',
    'v-ext-data-hash',
    'v-tx-sender',
    'v-tx-root',
    'v-receipts-root',
    'v-withdrawals-root',
    'v-logs-bloom',
    'v-call-frames',
    'no-log-index-check',
    'no-cumulative-gas-check',
    'gas-used-receipts-root',
])

/**
 * A cheap early reject. The tag is what the publisher says about itself,
 * what a block really holds is for the line checks to establish.
 */
export function matchComponents(tag: string, rule: ComponentsRule): boolean {
    let names = new Set<string>()

    for (let name of tag.split(',')) {
        let isAcceptable = KNOWN_NAMES.has(name) && !names.has(name)
        if (!isAcceptable) return false

        names.add(name)
    }

    for (let [name, on] of rule.exact) {
        if (names.has(name) != on) return false
    }

    for (let name of rule.required) {
        if (!names.has(name)) return false
    }

    for (let name of rule.forbidden) {
        if (names.has(name)) return false
    }

    return true
}
