import {addErrorContext, assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import type {ChainUtils} from './chain-utils'
import type {DebugFrameResult, GetBlock, Log, Receipt, Transaction} from './rpc-data'
import {qty2Int} from './util'
import {checkCallFrameTree, checkDebugFrameStructure, findDefectiveSelfdestructs} from './verification'

/**
 * Checks of block data against the block header, that need nothing but the data itself
 */
export interface BlockCheckOptions {
    verifyBlockHash?: boolean
    verifyExtDataHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyWithdrawalsRoot?: boolean
    verifyLogsBloom?: boolean
    checkLogIndex?: boolean
    checkCumulativeGasUsed?: boolean
}

export async function checkBlockHeader(
    block: GetBlock,
    withTransactions: boolean,
    utils: ChainUtils,
    options: BlockCheckOptions,
): Promise<void> {
    if (options.verifyBlockHash) {
        let blockHash = utils.calculateBlockHash(block)
        assert.equal(block.hash, blockHash, 'failed to verify block hash')
    }

    if (options.verifyExtDataHash && block.extDataHash != null) {
        let extDataHash = utils.calculateExtDataHash(block)
        assert.equal(block.extDataHash, extDataHash, 'failed to verify extData hash')
    }

    if (options.verifyTxRoot && withTransactions) {
        let txRoot = await utils.calculateTransactionsRoot(block)
        assert.equal(block.transactionsRoot, txRoot, 'failed to verify transactions root')
    }

    if (options.verifyTxSender && withTransactions) {
        for (let tx of block.transactions) {
            let transaction = tx as Transaction
            try {
                let sender = utils.recoverTxSender(transaction)
                if (sender == null) continue
                assert.equal(transaction.from, sender, 'failed to verify transaction sender')
            } catch (err: any) {
                throw addErrorContext(err, {
                    transactionIndex: qty2Int(transaction.transactionIndex),
                    transactionHash: transaction.hash,
                })
            }
        }
    }

    if (options.verifyWithdrawalsRoot && block.withdrawalsRoot != null) {
        let withdrawals = assertNotNull(block.withdrawals)
        let withdrawalsRoot = await utils.calculateWithdrawalsRoot(withdrawals)
        assert.equal(block.withdrawalsRoot, withdrawalsRoot, 'failed to verify withdrawals root')
    }
}

/**
 * @param logs all logs of the block in their order
 */
export function checkBlockLogs(
    block: GetBlock,
    logs: Log[],
    utils: ChainUtils,
    options: BlockCheckOptions,
    logIndexMessage?: string,
): void {
    if (options.checkLogIndex) {
        checkLogIndexes(logs, logIndexMessage)
    }

    if (options.verifyLogsBloom) {
        checkLogsBloom(block, logs, utils)
    }
}

/**
 * @param receipts all receipts of the block in the order of its transactions
 */
export async function checkBlockReceipts(
    block: GetBlock,
    receipts: Receipt[],
    logs: Log[],
    utils: ChainUtils,
    options: BlockCheckOptions,
    logIndexMessage?: string,
): Promise<void> {
    if (options.checkLogIndex) {
        checkLogIndexes(logs, logIndexMessage)
    }

    if (options.checkCumulativeGasUsed) {
        let prevCumulativeGasUsed = 0n
        for (let receipt of receipts) {
            let cumulativeGasUsed = BigInt(receipt.cumulativeGasUsed)
            assert.equal(
                cumulativeGasUsed,
                prevCumulativeGasUsed + BigInt(receipt.gasUsed),
                `cumulativeGasUsed mismatch at receipt of tx ${receipt.transactionHash}`,
            )
            prevCumulativeGasUsed = cumulativeGasUsed
        }
    }

    if (options.verifyLogsBloom) {
        checkLogsBloom(block, logs, utils)
    }

    if (options.verifyReceiptsRoot) {
        let root = await utils.calculateReceiptsRoot(block, receipts)
        assert.equal(block.receiptsRoot, root, 'failed to verify receipts root')
    }
}

function checkLogIndexes(logs: Log[], message?: string): void {
    let logIndex = 0
    for (let log of logs) {
        assert.equal(qty2Int(log.logIndex), logIndex++, message)
    }
}

function checkLogsBloom(block: GetBlock, logs: Log[], utils: ChainUtils): void {
    let logsBloom = utils.calculateLogsBloom(block, logs)
    assert.equal(block.logsBloom, logsBloom, 'failed to verify logs bloom')
}

/**
 * Checks call frames that can no longer be repaired or re-fetched, e.g. those taken from a cache.
 *
 * @returns what is wrong with the frames, if anything
 */
export function checkStoredDebugFrame(
    tx: Transaction,
    frame: DebugFrameResult,
    withCallFrameTree: boolean,
): string | undefined {
    if (frame.txHash != null && frame.txHash.toLowerCase() !== tx.hash.toLowerCase()) {
        return `call frames are labelled with transaction ${frame.txHash}`
    }

    let structuralViolation = checkDebugFrameStructure(frame.result)
    if (structuralViolation) return structuralViolation

    let defective = findDefectiveSelfdestructs(frame.result)
    if (defective.length > 0) return 'a selfdestruct frame does not match the opcode'

    if (withCallFrameTree) return checkCallFrameTree(tx, frame.result)
}
