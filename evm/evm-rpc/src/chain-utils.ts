import {assertNotNull} from '@subsquid/util-internal'
import {GetBlock, Log, Receipt, Transaction} from './rpc-data'
import {Qty} from './types'
import {blockHash, logsBloom, receiptsRoot, recoverTxSender, transactionsRoot} from './verification'
import {getTxHash} from './util'


export class ChainUtils {
    public isPolygonMainnet: boolean

    constructor(chainId: Qty) {
        this.isPolygonMainnet = chainId == '0x89'
    }

    calculateBlockHash(block: GetBlock) {
        return blockHash(block)
    }

    calculateTransactionsRoot(transactions: Transaction[]) {
        if (this.isPolygonMainnet) {
            transactions = transactions.filter(tx => !isPolygonPrecompiled(tx))
        }
        return transactionsRoot(transactions)
    }

    calculateLogsBloom(block: GetBlock, logs: Log[]) {
        if (this.isPolygonMainnet) {
            let transactions = block.transactions as Transaction[]
            let txByHash = new Map(transactions.map(tx => [getTxHash(tx), tx]))
            logs = logs.filter(log => {
                let tx = assertNotNull(txByHash.get(log.transactionHash))
                return !isPolygonPrecompiled(tx)
            })
        }
        return logsBloom(logs)
    }

    calculateReceiptsRoot(receipts: Receipt[]) {
        if (this.isPolygonMainnet) {
            receipts = receipts.filter(receipt => !isPolygonPrecompiled(receipt))
        }
        return receiptsRoot(receipts)
    }

    recoverTxSender(transaction: Transaction) {
        return recoverTxSender(transaction)
    }
}


function isPolygonPrecompiled(txOrReceipt: Transaction | Receipt) {
    let address = '0x0000000000000000000000000000000000000000'
    return txOrReceipt.from == address && txOrReceipt.to == address
}
