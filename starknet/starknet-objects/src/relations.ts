import {maybeLast} from '@subsquid/util-internal'
import {Block, Transaction} from './items'

export function setUpRelations(block: Block): void {
    block.transactions.sort((a, b) => a.transactionIndex - b.transactionIndex)
    block.events.sort((a, b) => a.transactionIndex - b.transactionIndex || a.eventIndex - b.eventIndex)

    let txs: (Transaction | undefined)[] = new Array((maybeLast(block.transactions)?.transactionIndex ?? -1) + 1)
    for (let tx of block.transactions) {
        txs[tx.transactionIndex] = tx
    }

    for (let e of block.events) {
        let tx = txs[e.transactionIndex]
        if (tx) {
            e.transaction = tx
            tx.events.push(e)
        }
    }
}