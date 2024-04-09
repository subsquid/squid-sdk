import {maybeLast} from '@subsquid/util-internal'
import {Block, Trace, Transaction} from './entities'


export function setUpRelations(block: Block): void {
    block.transactions.sort((a, b) => a.transactionIndex - b.transactionIndex)
    block.logs.sort((a, b) => a.logIndex - b.logIndex)
    block.traces.sort(traceCompare)

    let txs: (Transaction | undefined)[] = new Array((maybeLast(block.transactions)?.transactionIndex ?? -1) + 1)
    for (let tx of block.transactions) {
        txs[tx.transactionIndex] = tx
    }

    for (let rec of block.logs) {
        let tx = txs[rec.transactionIndex]
        if (tx) {
            rec.transaction = tx
            tx.logs.push(rec)
        }
    }

    for (let i = 0; i < block.traces.length; i++) {
        let rec = block.traces[i]
        let tx = txs[rec.transactionIndex]
        if (tx) {
            rec.transaction = tx
            tx.traces.push(rec)
        }
        for (let j = i + 1; j < block.traces.length; j++) {
            let next = block.traces[j]
            if (isDescendent(rec, next)) {
                rec.children.push(next)
                if (next.traceAddress.length == rec.traceAddress.length + 1) {
                    next.parent = rec
                }
            } else {
                break
            }
        }
    }

    for (let rec of block.stateDiffs) {
        let tx = txs[rec.transactionIndex]
        if (tx) {
            rec.transaction = tx
            tx.stateDiffs.push(rec)
        }
    }
}


function traceCompare(a: Trace, b: Trace) {
    return a.transactionIndex - b.transactionIndex || addressCompare(a.traceAddress, b.traceAddress)
}


function addressCompare(a: number[], b: number[]): number {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        let order = a[i] - b[i]
        if (order) return order
    }
    return a.length - b.length // this differs from substrate call ordering
}


function isDescendent(parent: Trace, child: Trace): boolean {
    if (parent.transactionIndex != child.transactionIndex) return false
    if (parent.traceAddress.length >= child.traceAddress.length) return false
    for (let i = 0; i < parent.traceAddress.length; i++) {
        if (parent.traceAddress[i] != child.traceAddress[i]) return false
    }
    return true
}
