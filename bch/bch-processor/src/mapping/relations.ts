import {maybeLast} from '@subsquid/util-internal'
import {Block, Transaction} from './entities.js'


export function setUpRelations(block: Block): void {
    block.transactions.sort((a, b) => a.transactionIndex - b.transactionIndex)

    let txs: (Transaction | undefined)[] = new Array((maybeLast(block.transactions)?.transactionIndex ?? -1) + 1)
    for (let tx of block.transactions) {
        txs[tx.transactionIndex] = tx
    }
}
