import type {RawBlock, RawTransaction} from '@subsquid/evm-normalization'
import {
    type BlockCheckOptions,
    type ChainUtils,
    checkBlockHeader,
    checkBlockLogs,
    checkBlockReceipts,
    checkConsensusAnchors,
    checkStoredDebugFrame,
    type ConsensusAnchorRule,
    type ConsensusAnchorViolation,
    DEFAULT_CONSENSUS_ANCHOR_RULES,
    DebugFrameResult,
    DebugStateDiffResult,
    GetBlock,
    getTraceTransactionReplayValidator,
    Log,
    qty2Int,
    Receipt,
    systemBalanceDeltaFromPrestate,
    systemBalanceDeltaFromReplay,
} from '@subsquid/evm-rpc'
import type {BlockLink, LineVerifier} from '@subsquid/util-internal-dump-stream'
import type {ComponentOptions} from './components'

interface Validator {
    validate(value: unknown): {toString(): string} | undefined
}

interface Selection {
    logs: boolean
    receipts: boolean
    debugFrames: boolean
    debugStateDiffs: boolean
    traceReplay?: Validator
}

/**
 * The consensus anchor violations of one transaction of a streamed block
 */
export interface ConsensusAnchorObservation {
    blockNumber: number
    blockHash: string
    transactionIndex: number
    transactionHash: string
    violations: ConsensusAnchorViolation[]
}

export interface LineVerifierHooks {
    /**
     * Called with `--consensus-anchor-validation observe` for a streamed block that violates
     * a rule, once for each violating transaction. The block is taken.
     */
    onConsensusAnchorViolation?(observation: ConsensusAnchorObservation): void
}

export function createLineVerifier(
    utils: ChainUtils,
    options: ComponentOptions,
    hooks: LineVerifierHooks = {},
): LineVerifier<RawBlock> {
    let selection = getSelection(options)
    let withCallFrameTree = options.callFrameValidation == 'reject'

    let anchorMode = options.consensusAnchorValidation ?? 'off'
    let anchorRules = new Set<ConsensusAnchorRule>(options.consensusAnchorRules ?? DEFAULT_CONSENSUS_ANCHOR_RULES)
    if (anchorMode != 'off' && (!selection.receipts || !selection.debugFrames)) {
        // The same requirement the dumper puts on its RPC path: a block that cannot be checked
        // must not pass as checked
        throw new Error('consensus anchor validation needs receipts and debug call frames')
    }

    let checks: BlockCheckOptions = {
        verifyExtDataHash: options.verifyExtDataHash,
        verifyTxSender: options.verifyTxSender,
        verifyTxRoot: options.verifyTxRoot,
        verifyReceiptsRoot: options.verifyReceiptsRoot,
        verifyWithdrawalsRoot: options.verifyWithdrawalsRoot,
        verifyLogsBloom: options.verifyLogsBloom,
        checkLogIndex: !options.skipLogIndexCheck,
        checkCumulativeGasUsed: !options.skipCumulativeGasUsedCheck,
    }

    return async function verifyLine(block, expected) {
        if (options.verifyBlockHash) {
            let hashDefect = findHashDefect(block, expected, utils)
            if (hashDefect) return {reason: 'hash', details: hashDefect}
        }

        try {
            let defect =
                findShapeDefect(block, selection, utils) ??
                findLinkDefect(block, expected) ??
                findCallFrameDefect(block, withCallFrameTree)

            if (defect) return {reason: 'verify', details: defect}

            await checkBlockHeader(block, true, utils, checks)

            let txHashDefect = options.verifyTxRoot ? findTxHashDefect(block, utils) : undefined
            if (txHashDefect) return {reason: 'verify', details: txHashDefect}

            if (selection.receipts) {
                let receipts = block.transactions.map((tx) => tx.receipt_!)
                let logs = receipts.flatMap((receipt) => receipt.logs)
                await checkBlockReceipts(block, receipts, logs, utils, checks)
            } else {
                checkBlockLogs(block, block.logs_!, utils, checks)
            }

            if (anchorMode != 'off') {
                let found = findConsensusAnchorViolations(block, anchorRules, selection, !!options.withStatediffs)
                if (found.length > 0 && anchorMode == 'reject') {
                    // A miss: the block goes to RPC, whose checks reject and re-fetch it the same way
                    let {transactionHash, violations} = found[0]
                    let v = violations[0]
                    return {
                        reason: 'verify',
                        details:
                            `consensus anchor violation (${v.rule}) for transaction ${transactionHash}: ` +
                            `expected ${v.expected}, got ${v.actual}`,
                    }
                }
                for (let observation of found) {
                    hooks.onConsensusAnchorViolation?.(observation)
                }
            }
        } catch (err: any) {
            return {reason: 'verify', details: String(err?.message ?? err)}
        }
    }
}

/**
 * The rules `Rpc` applies to the blocks it fetches, applied to a streamed block: each transaction's
 * root call frame, and its state diff when the dumper takes state diffs, against its receipt
 */
function findConsensusAnchorViolations(
    block: RawBlock,
    rules: ReadonlySet<ConsensusAnchorRule>,
    selection: Selection,
    withStatediffs: boolean,
): ConsensusAnchorObservation[] {
    let number = Number(block.number)
    if (number == 0) return []

    let found: ConsensusAnchorObservation[] = []
    for (let i = 0; i < block.transactions.length; i++) {
        let tx = block.transactions[i]
        // The shape check has made sure every transaction has its receipt
        let receipt = tx.receipt_!

        // `null`: state diffs are taken, but there is none for this transaction
        let systemBalanceDelta: bigint | null | undefined = withStatediffs ? null : undefined
        if (selection.debugStateDiffs) {
            let diff = tx.debugStateDiff_
            if (diff != null && (diff.txHash == null || diff.txHash.toLowerCase() === tx.hash.toLowerCase())) {
                systemBalanceDelta = systemBalanceDeltaFromPrestate(diff.result)
            }
        } else if (withStatediffs && tx.traceReplay_?.stateDiff != null) {
            systemBalanceDelta = systemBalanceDeltaFromReplay(tx.traceReplay_.stateDiff)
        }

        let violations = checkConsensusAnchors(
            {
                miner: block.miner,
                transaction: tx,
                receipt: {
                    status: receipt.status != null ? qty2Int(receipt.status) : undefined,
                    gasUsed: receipt.gasUsed,
                    effectiveGasPrice: receipt.effectiveGasPrice,
                    blobGasUsed: receipt.blobGasUsed,
                    blobGasPrice: receipt.blobGasPrice,
                },
                root: tx.debugFrame_?.result,
                systemBalanceDelta,
            },
            rules,
        )

        if (violations.length > 0) {
            found.push({
                blockNumber: number,
                blockHash: block.hash,
                transactionIndex: i,
                transactionHash: tx.hash,
                violations,
            })
        }
    }
    return found
}

function getSelection(options: ComponentOptions): Selection {
    let replayTracers = {
        trace: !!options.withTraces && !!options.useTraceApi,
        stateDiff: !!options.withStatediffs && !options.useDebugApiForStatediffs,
    }

    let hasReplay = replayTracers.trace || replayTracers.stateDiff

    return {
        logs: !options.withReceipts,
        receipts: !!options.withReceipts,
        debugFrames: !!options.withTraces && !options.useTraceApi,
        debugStateDiffs: !!options.withStatediffs && !!options.useDebugApiForStatediffs,
        traceReplay: hasReplay ? getTraceTransactionReplayValidator(replayTracers) : undefined,
    }
}

/**
 * The header hash covers the number, the parent hash and every root of the block,
 * so a match with the trusted hash makes all of them authentic.
 *
 * Made only with `--verify-block-hash`, as on the RPC path. A chain whose header hash RPC fields do not give
 * runs without it, and its blocks are taken for the hash and the parent hash they state, which `readLine()` has matched.
 */
function findHashDefect(block: RawBlock, expected: BlockLink, utils: ChainUtils): string | undefined {
    let hash: string
    try {
        hash = utils.calculateBlockHash(block)
    } catch (err: any) {
        return `failed to hash the header: ${err?.message ?? err}`
    }

    if (hash !== expected.hash) return `the header hashes to ${hash}`
}

/**
 * The transactions root covers the encoded transactions, not the hashes put next to them,
 * and everything else in the block refers to a transaction by its hash.
 */
function findTxHashDefect(block: RawBlock, utils: ChainUtils): string | undefined {
    for (let tx of utils.getRootTransactions(block) ?? []) {
        let hash = utils.calculateTransactionHash(tx)
        if (hash !== tx.hash) return `transaction ${tx.hash} hashes to ${hash}`
    }
}

/**
 * A block must hold exactly what the dumper would have fetched itself
 */
function findShapeDefect(block: RawBlock, selection: Selection, utils: ChainUtils): string | undefined {
    let invalidBlock = GetBlock.validate(block)
    if (invalidBlock) return invalidBlock.toString()

    if (block.unknownTraceReplays_ != null) return 'unexpected trace replays'

    // Block access lists are not taken from the stream yet
    if (block.blockAccessList_ != null) return 'unexpected block access list'

    if (selection.logs) {
        if (!Array.isArray(block.logs_)) return 'logs are missing'

        for (let log of block.logs_) {
            let invalidLog = Log.validate(log)
            if (invalidLog) return `invalid log: ${invalidLog}`
        }
    } else if (block.logs_ != null) {
        return 'unexpected logs'
    }

    let isGenesis = Number(block.number) == 0
    let isTraceOptional = isGenesis || utils.isPolygonBased

    let receiptValidator = selection.receipts && Receipt
    let frameValidator = selection.debugFrames && DebugFrameResult
    let diffValidator = selection.debugStateDiffs && DebugStateDiffResult
    let replayValidator = selection.traceReplay ?? false

    for (let tx of block.transactions) {
        if (tx == null || typeof tx != 'object') return 'transaction details are missing'

        // RPC drops the empty call frame some chains answer for a transaction
        let isFrameOptional = isTraceOptional || utils.allowsEmptyCallFrame(tx)

        let defect =
            findPartDefect('receipt', tx.receipt_, receiptValidator, false) ??
            findPartDefect('call frames', tx.debugFrame_, frameValidator, isFrameOptional) ??
            findPartDefect('state diff', tx.debugStateDiff_, diffValidator, isTraceOptional) ??
            findPartDefect('trace replay', tx.traceReplay_, replayValidator, isGenesis)

        if (defect) return `transaction ${tx.hash}: ${defect}`
    }
}

function findPartDefect(
    name: string,
    value: unknown,
    validator: Validator | false,
    isOptional: boolean,
): string | undefined {
    if (!validator) return value == null ? undefined : `unexpected ${name}`

    if (value == null) return isOptional ? undefined : `${name} is missing`

    let invalid = validator.validate(value)
    if (invalid) return `invalid ${name}: ${invalid}`
}

interface BlockItem {
    blockHash: string
    blockNumber: string
}

function isOfBlock(item: BlockItem, block: BlockLink): boolean {
    let hasHash = item.blockHash === block.hash
    let hasNumber = Number(item.blockNumber) === block.number
    return hasHash && hasNumber
}

/**
 * Every part of a block must say it belongs to this block and to its own transaction
 */
function findLinkDefect(block: RawBlock, expected: BlockLink): string | undefined {
    for (let i = 0; i < block.transactions.length; i++) {
        let tx = block.transactions[i]

        if (!isOfBlock(tx, expected)) return `transaction ${tx.hash} is of another block`
        if (Number(tx.transactionIndex) !== i) return `transaction ${tx.hash} is out of order`

        let defect = findTransactionPartDefect(tx, expected)
        if (defect) return `transaction ${tx.hash}: ${defect}`
    }

    for (let log of block.logs_ ?? []) {
        if (!isOfBlock(log, expected)) return 'a log is of another block'

        let tx = block.transactions[Number(log.transactionIndex)]
        if (tx === undefined || log.transactionHash !== tx.hash) return 'a log is of another transaction'
    }
}

function findTransactionPartDefect(tx: RawTransaction, block: BlockLink): string | undefined {
    let receipt = tx.receipt_
    if (receipt) {
        if (!isOfBlock(receipt, block)) return 'the receipt is of another block'
        if (receipt.transactionHash !== tx.hash) return 'the receipt is of another transaction'
        if (receipt.transactionIndex !== tx.transactionIndex) return 'the receipt is of another transaction'

        for (let log of receipt.logs) {
            if (!isOfBlock(log, block)) return 'a receipt log is of another block'
            if (log.transactionHash !== tx.hash) return 'a receipt log is of another transaction'
            if (Number(log.transactionIndex) !== Number(tx.transactionIndex)) {
                return 'a receipt log is of another transaction'
            }
        }
    }

    let diffHash = tx.debugStateDiff_?.txHash
    if (diffHash != null && diffHash !== tx.hash) return 'the state diff is of another transaction'

    let replay = tx.traceReplay_
    if (replay == null) return

    if (replay.transactionHash != null && replay.transactionHash !== tx.hash) {
        return 'the trace replay is of another transaction'
    }

    for (let frame of replay.trace ?? []) {
        if (frame.blockHash != null && frame.blockHash !== block.hash) return 'a trace is of another block'

        let frameTx = frame.transactionHash
        if (frameTx != null && frameTx !== tx.hash) return 'a trace is of another transaction'
    }
}

function findCallFrameDefect(block: RawBlock, withCallFrameTree: boolean): string | undefined {
    for (let tx of block.transactions) {
        if (tx.debugFrame_ == null) continue

        let defect = checkStoredDebugFrame(tx, tx.debugFrame_, withCallFrameTree)
        if (defect) return `transaction ${tx.hash}: ${defect}`
    }
}
