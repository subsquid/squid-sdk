import {maybeLast} from '@subsquid/util-internal'
import {Block, Transaction} from './entities'


export function setUpRelations(block: Block): void {
    block.transactions.sort((a, b) => a.transactionIndex - b.transactionIndex)
    block.logs.sort((a, b) => a.transactionIndex - b.transactionIndex || a.logIndex - b.logIndex)
    block.internalTransactions.sort((a, b) => {
        return a.transactionIndex - b.transactionIndex || a.internalTransactionIndex - b.internalTransactionIndex
    })

    let txs: (Transaction | undefined)[] = new Array((maybeLast(block.transactions)?.transactionIndex ?? -1) + 1)
    for (let tx of block.transactions) {
        txs[tx.transactionIndex] = tx
    }

    for (let log of block.logs) {
        let tx = txs[log.transactionIndex]
        if (tx) {
            log.transaction = tx
            tx.logs.push(log)
        }
    }

    for (let internalTx of block.internalTransactions) {
        let tx = txs[internalTx.transactionIndex]
        if (tx) {
            internalTx.transaction = tx
            tx.internalTransactions.push(internalTx)
        }
    }
}
