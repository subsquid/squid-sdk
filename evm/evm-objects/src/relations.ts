import {maybeLast} from '@subsquid/util-internal'
import {Block, Trace, Transaction} from './items'


export function setUpRelations(block: Block): void {
    block.transactions.sort((a, b) => a.transactionIndex - b.transactionIndex)
    block.logs.sort((a, b) => a.logIndex - b.logIndex)
    block.traces.sort(traceCompare)

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

    for (let i = 0; i < block.traces.length; i++) {
        let trace = block.traces[i]
        let tx = txs[trace.transactionIndex]
        if (tx) {
            trace.transaction = tx
            tx.traces.push(trace)
        }
        for (let j = i + 1; j < block.traces.length; j++) {
            let next = block.traces[j]
            if (isDescendent(trace, next)) {
                trace.children.push(next)
                if (next.traceAddress.length == trace.traceAddress.length + 1) {
                    next.parent = trace
                }
            } else {
                break
            }
        }
    }

    for (let stateDiff of block.stateDiffs) {
        let tx = txs[stateDiff.transactionIndex]
        if (tx) {
            stateDiff.transaction = tx
            tx.stateDiffs.push(stateDiff)
        }
    }
}


function traceCompare(a: Trace, b: Trace): number {
    return a.transactionIndex - b.transactionIndex || addressCompare(a.traceAddress, b.traceAddress)
}


function addressCompare(a: number[], b: number[]): number {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        let order = a[i] - b[i]
        if (order) return order
    }
    return a.length - b.length
}


function isDescendent(parent: Trace, child: Trace): boolean {
    if (parent.transactionIndex != child.transactionIndex) return false
    if (parent.traceAddress.length >= child.traceAddress.length) return false
    for (let i = 0; i < parent.traceAddress.length; i++) {
        if (parent.traceAddress[i] != child.traceAddress[i]) return false
    }
    return true
}
