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
    public isHyperliquidMainnet: boolean
    public isHyperliquidTestnet: boolean

    constructor(chainId: Qty) {
        this.isPolygonMainnet = chainId == '0x89'
        this.isHyperliquidMainnet = chainId == '0x3e7'
        this.isHyperliquidTestnet = chainId == '0x3e6'
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

        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            transactions = transactions.filter(tx => !isHyperliquidSystemAddress(tx))
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

        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            let transactions = block.transactions as Transaction[]
            let txByHash = new Map(transactions.map(tx => [getTxHash(tx), tx]))
            logs = logs.filter(log => {
                let tx = assertNotNull(txByHash.get(log.transactionHash))
                return !isHyperliquidSystemAddress(tx)
            })
        }

        return logsBloom(logs)
    }

    calculateReceiptsRoot(block: GetBlock, receipts: Receipt[]) {
        if (this.isPolygonMainnet) {
            let stateSyncTxHash = calculateStateSyncTxHash(block.number, block.hash)
            receipts = receipts.filter(receipt => receipt.transactionHash != stateSyncTxHash)
        }

        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            receipts = receipts.filter(receipt => !isHyperliquidSystemAddress(receipt))
        }

        return receiptsRoot(receipts)
    }

    recoverTxSender(transaction: Transaction) {
        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            if (isHyperliquidSystemAddress(transaction)) return
        }

        return recoverTxSender(transaction)
    }
}


function isHyperliquidSystemAddress(txOrReceipt: Transaction | Receipt) {
    // https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers#system-addresses
    return txOrReceipt.from == '0x2222222222222222222222222222222222222222' || txOrReceipt.from.startsWith('0x20')
}
