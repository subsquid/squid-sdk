import {
    GetBlock,
    Transaction,
    Receipt,
    Log,
    TraceTransactionReplay,
    Block,
    DebugFrameResult,
    DebugStateDiffResult,
    BlockAccessList,
    calculateStateSyncTxHash
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
    blockAccessList_?: BlockAccessList
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

    if (block.blockAccessList) {
        rawBlock.blockAccessList_ = block.blockAccessList
    }

    if (block.receipts) {
        let byTx = new Map(block.receipts.map(receipt => [receipt.transactionHash, receipt]))
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            tx.receipt_ = assertNotNull(byTx.get(tx.hash))
        }
    }

    if (block.traceReplays) {
        let byTx = new Map(block.traceReplays.map(replay => [assertNotNull(replay.transactionHash).toLowerCase(), replay]))
        let stateSyncTxHash: string | undefined
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            let replay = byTx.get(tx.hash.toLowerCase())
            if (replay == null) {
                // Bor (Polygon and its derivatives) does not replay the derived state-sync transaction
                // that older blocks list last in their body. It is stored without a replay, as the debug
                // API path stores it without a call frame. The hash is derived from the block number and
                // hash, so no transaction of another chain can match it.
                stateSyncTxHash ??= calculateStateSyncTxHash(rawBlock.number, rawBlock.hash).toLowerCase()
                if (tx.hash.toLowerCase() === stateSyncTxHash) continue
                throw new Error(`block ${rawBlock.number}#${rawBlock.hash}: no trace replay for transaction ${tx.hash}`)
            }
            tx.traceReplay_ = replay
        }
    }

    if (block.debugFrames) {
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            let frame = block.debugFrames[i]
            if (frame?.txHash) {
                assert(frame.txHash == tx.hash)
            }
            tx.debugFrame_ = frame
        }
    }
    
    if (block.debugStateDiffs) {
        for (let i = 0; i < transactions.length; i++) {
            let tx = transactions[i]
            let diffs = block.debugStateDiffs[i]
            if (diffs?.txHash) {
                assert(diffs.txHash == tx.hash)
            }
            tx.debugStateDiff_ = diffs
        }
    }

    return rawBlock
}
