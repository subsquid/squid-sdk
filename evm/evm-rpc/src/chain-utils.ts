import {assertNotNull} from '@subsquid/util-internal'
import {GetBlock, Log, Receipt, Transaction} from './rpc-data'
import {Qty} from './types'
import {
    blockHash,
    logsBloom,
    receiptsRoot,
    recoverTxSender,
    transactionsRoot,
    calculateStateSyncTxHash
} from './verification'
import {getTxHash} from './util'


export class ChainUtils {
    public isPolygonMainnet: boolean

    constructor(chainId: Qty) {
        this.isPolygonMainnet = chainId == '0x89'
    }

    calculateBlockHash(block: GetBlock) {
        return blockHash(block)
    }

    calculateTransactionsRoot(block: GetBlock) {
        let transactions = block.transactions as Transaction[]
        if (this.isPolygonMainnet) {
            let stateSyncTxHash = calculateStateSyncTxHash(block.number, block.hash)
            let txs = []
            for (let tx of transactions) {
                if (tx.type == '0x7f') {
                    // PIP-74 tx type requires extra data that can't be obtained from rpc
                    // so for now blocks that contain this tx type aren't verified
                    return block.transactionsRoot
                }

                if (tx.hash != stateSyncTxHash) {
                    txs.push(tx)
                }
            }
        }
        return transactionsRoot(transactions)
    }

    calculateLogsBloom(block: GetBlock, logs: Log[]) {
        if (this.isPolygonMainnet) {
            let transactions = block.transactions as Transaction[]
            let txByHash = new Map(transactions.map(tx => [getTxHash(tx), tx]))
            let stateSyncTxHash = calculateStateSyncTxHash(block.number, block.hash)
            logs = logs.filter(log => {
                let tx = assertNotNull(txByHash.get(log.transactionHash))
                return tx.hash != stateSyncTxHash
            })
        }
        return logsBloom(logs)
    }

    calculateReceiptsRoot(block: GetBlock, receipts: Receipt[]) {
        if (this.isPolygonMainnet) {
            let stateSyncTxHash = calculateStateSyncTxHash(block.number, block.hash)
            receipts = receipts.filter(receipt => receipt.transactionHash != stateSyncTxHash)
        }
        return receiptsRoot(receipts)
    }

    recoverTxSender(transaction: Transaction) {
        return recoverTxSender(transaction)
    }
}
