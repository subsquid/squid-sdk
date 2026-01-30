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
    public isStable: boolean

    constructor(chainId: Qty) {
        this.isPolygonMainnet = chainId == '0x89'
        this.isHyperliquidMainnet = chainId == '0x3e7'
        this.isHyperliquidTestnet = chainId == '0x3e6'
        this.isStable = chainId == '0x3dc' || chainId == '0x899' // Chain ID 988 (mainnet) or 2201 (testnet)
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
            transactions = transactions.filter(tx => !isHyperliquidSystemTx(tx))
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
                return !isHyperliquidSystemTx(tx)
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
            receipts = receipts.filter(receipt => !isHyperliquidSystemReceipt(receipt))
        }

        // Stable chain uses gasUsed instead of cumulativeGasUsed in receipts root
        if (this.isStable) {
            return receiptsRoot(receipts, {useGasUsed: true})
        }

        return receiptsRoot(receipts)
    }

    recoverTxSender(transaction: Transaction) {
        if (this.isHyperliquidMainnet || this.isHyperliquidTestnet) {
            if (isHyperliquidSystemTx(transaction)) return
        }

        return recoverTxSender(transaction)
    }
}


function isHyperliquidSystemTx(tx: Transaction) {
    // https://github.com/hl-archive-node/nanoreth/blob/732f8c574db2dde90344a29b0292189a5cddd2d1/src/node/primitives/transaction.rs#L165
    return tx.gasPrice == '0x0'
}


function isHyperliquidSystemReceipt(receipt: Receipt) {
    // https://github.com/hl-archive-node/nanoreth/blob/732f8c574db2dde90344a29b0292189a5cddd2d1/src/addons/hl_node_compliance.rs#L365
    return receipt.cumulativeGasUsed == '0x0'
}
