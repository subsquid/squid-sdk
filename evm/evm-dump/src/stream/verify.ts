import type {RawBlock, RawTransaction} from '@subsquid/evm-normalization'
import {
    type BlockCheckOptions,
    type ChainUtils,
    checkBlockHeader,
    checkBlockLogs,
    checkBlockReceipts,
    checkStoredDebugFrame,
    DebugFrameResult,
    DebugStateDiffResult,
    GetBlock,
    getTraceTransactionReplayValidator,
    Log,
    Receipt,
} from '@subsquid/evm-rpc'
import type {ComponentOptions} from './components'
import type {BlockLink} from './message'

export interface LineDefect {
    reason: 'hash' | 'verify'
    details: string
}

/**
 * Tells what is wrong with a block taken from the stream, if anything.
 *
 * `expected.hash` must come from a trusted source, the rest of the trust is derived from it.
 */
export type LineVerifier = (block: RawBlock, expected: BlockLink) => Promise<LineDefect | undefined>

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

export function createLineVerifier(utils: ChainUtils, options: ComponentOptions): LineVerifier {
    let selection = getSelection(options)
    let withCallFrameTree = options.callFrameValidation == 'reject'

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
        let hashDefect = findHashDefect(block, expected, utils)
        if (hashDefect) return {reason: 'hash', details: hashDefect}

        try {
            let defect =
                findShapeDefect(block, selection, utils) ??
                findLinkDefect(block, expected) ??
                findCallFrameDefect(block, withCallFrameTree)

            if (defect) return {reason: 'verify', details: defect}

            await checkBlockHeader(block, true, utils, checks)

            if (selection.receipts) {
                let receipts = block.transactions.map((tx) => tx.receipt_!)
                let logs = receipts.flatMap((receipt) => receipt.logs)
                await checkBlockReceipts(block, receipts, logs, utils, checks)
            } else {
                checkBlockLogs(block, block.logs_!, utils, checks)
            }
        } catch (err: any) {
            return {reason: 'verify', details: String(err?.message ?? err)}
        }
    }
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
 * A block must hold exactly what the dumper would have fetched itself
 */
function findShapeDefect(block: RawBlock, selection: Selection, utils: ChainUtils): string | undefined {
    let invalidBlock = GetBlock.validate(block)
    if (invalidBlock) return invalidBlock.toString()

    if (block.unknownTraceReplays_ != null) return 'unexpected trace replays'

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

        let defect =
            findPartDefect('receipt', tx.receipt_, receiptValidator, false) ??
            findPartDefect('call frames', tx.debugFrame_, frameValidator, isTraceOptional) ??
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
