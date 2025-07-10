import {
    GetBlock,
    Transaction,
    Receipt,
    Log,
    TraceTransactionReplay,
    Block,
    DebugFrameResult,
    DebugStateDiffResult
} from '@subsquid/evm-rpc'
import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'


export type RawTransaction = Transaction & {
    receipt_?: Receipt,
    debugFrame_?: DebugFrameResult,
    debugStateDiff_?: DebugStateDiffResult,
    traceReplay_?: TraceTransactionReplay
}


export type RawBlock = GetBlock & {
    transactions: RawTransaction[]
    logs_?: Log[]
    unknownTraceReplays_?: TraceTransactionReplay[]
}


/**
 * `RawBlock` represents old block format used by the old dumper
 * and essential for backward compatibility.
 */
export function toRawBlock(block: Block): RawBlock {
    let rawBlock = block.block as RawBlock
    assert(typeof rawBlock.transactions != 'string')
    let transactions = rawBlock.transactions as RawTransaction[]

    if (block.logs) {
        assert(block.receipts == null)
        rawBlock.logs_ = block.logs
    }

    if (block.receipts) {
        let byTx = new Map(block.receipts.map(receipt => [receipt.transactionHash, receipt]))
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            tx.receipt_ = assertNotNull(byTx.get(tx.hash))
        }
    }

    if (block.traceReplays) {
        let byTx = new Map(block.traceReplays.map(replay => [assertNotNull(replay.transactionHash), replay]))
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            tx.traceReplay_ = assertNotNull(byTx.get(tx.hash))
        }
    }

    if (block.debugFrames) {
        assert(block.debugFrames.length == transactions.length)
        let byTx = new Map(block.debugFrames.map((frame, idx) => [idx, frame]))
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            tx.debugFrame_ = assertNotNull(byTx.get(i))
        }
    }
    
    if (block.debugStateDiffs) {
        assert(block.debugStateDiffs.length == transactions.length)
        let byTx = new Map(block.debugStateDiffs.map((diffs, idx) => [idx, diffs]))
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            tx.debugStateDiff_ = assertNotNull(byTx.get(i))
        }
    }

    return rawBlock
}
