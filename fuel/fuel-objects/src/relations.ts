import {maybeLast} from '@subsquid/util-internal'
import {Block, Transaction} from './items'


export function setUpRelations(block: Block): void {
    block.transactions.sort((a, b) => a.index - b.index)
    block.receipts.sort((a, b) => a.transactionIndex - b.transactionIndex || a.index - b.index)
    block.inputs.sort((a, b) => a.transactionIndex - b.transactionIndex || a.index - b.index)
    block.outputs.sort((a, b) => a.transactionIndex - b.transactionIndex || a.index - b.index)

    let txs: (Transaction | undefined)[] = new Array((maybeLast(block.transactions)?.index ?? -1) + 1)
    for (let tx of block.transactions) {
        txs[tx.index] = tx
    }

    for (let receipt of block.receipts) {
        let tx = txs[receipt.transactionIndex]
        if (tx) {
            receipt.transaction = tx
            tx.receipts.push(receipt)
        }
    }

    for (let input of block.inputs) {
        let tx = txs[input.transactionIndex]
        if (tx) {
            input.transaction = tx
            tx.inputs.push(input)
        }
    }

    for (let output of block.outputs) {
        let tx = txs[output.transactionIndex]
        if (tx) {
            output.transaction = tx
            tx.outputs.push(output)
        }
    }
}
