import {assertNotNull, groupBy, weakMemo} from '@subsquid/util-internal'
import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import {Block, Log, StateDiff, Trace, Transaction} from '../mapping/entities'
import {DataRequest} from '../interfaces/data-request'


function buildLogFilter(dataRequest: DataRequest): EntityFilter<Log, {
    transaction?: boolean,
    transactionLogs?: boolean,
    transactionStateDiffs?: boolean,
    transactionTraces?: boolean
}> {
    let items = new EntityFilter()
    for (let req of dataRequest.logs || []) {
        let {address, topic0, topic1, topic2, topic3, ...relations} = req
        let filter = new FilterBuilder<Log>()
        filter.propIn('address', address)
        filter.getIn(log => assertNotNull(log.topics)[0], topic0)
        filter.getIn(log => assertNotNull(log.topics)[1], topic1)
        filter.getIn(log => assertNotNull(log.topics)[2], topic2)
        filter.getIn(log => assertNotNull(log.topics)[3], topic3)
        items.add(filter, relations)
    }
    return items
}


function buildTransactionFilter(dataRequest: DataRequest): EntityFilter<Transaction, {
    logs?: boolean
    traces?: boolean
    stateDiffs?: boolean
}> {
    let items = new EntityFilter()
    for (let req of dataRequest.transactions || []) {
        let {to, from, sighash, type, ...relations} = req
        let filter = new FilterBuilder<Transaction>()
        filter.propIn('to', to)
        filter.propIn('from', from)
        filter.propIn('sighash', sighash)
        filter.propIn('type', type)
        items.add(filter, relations)
    }
    return items
}


function buildTraceFilter(dataRequest: DataRequest): EntityFilter<Trace, {
    transaction?: boolean
    transactionLogs?: boolean
    subtraces?: boolean
    parents?: boolean
}> {
    let items = new EntityFilter()
    for (let req of dataRequest.traces || []) {
        let {
            type,
            createFrom,
            callTo,
            callFrom,
            callSighash,
            suicideRefundAddress,
            rewardAuthor,
            ...relations
        } = req
        let filter = new FilterBuilder<Trace>()
        filter.propIn('type', type as Trace['type'][])
        filter.getIn(trace => trace.type === 'create' && assertNotNull(trace.action?.from), createFrom)
        filter.getIn(trace => trace.type === 'call' && assertNotNull(trace.action?.to), callTo)
        filter.getIn(trace => trace.type === 'call' && assertNotNull(trace.action?.from), callFrom)
        filter.getIn(trace => trace.type === 'call' && assertNotNull(trace.action?.sighash), callSighash)
        filter.getIn(trace => trace.type === 'suicide' && assertNotNull(trace.action?.refundAddress), suicideRefundAddress)
        filter.getIn(trace => trace.type === 'reward' && assertNotNull(trace.action?.author), rewardAuthor)
        items.add(filter, relations)
    }
    return items
}


function buildStateDiffFilter(dataRequest: DataRequest): EntityFilter<StateDiff, {transaction?: boolean}> {
    let items = new EntityFilter()
    for (let req of dataRequest.stateDiffs || []) {
        let {
            address,
            key,
            kind,
            ...relations
        } = req
        let filter = new FilterBuilder<StateDiff>()
        filter.propIn('address', address)
        filter.propIn('key', key)
        filter.propIn('kind', kind)
        items.add(filter, relations)
    }
    return items
}


const getItemFilter = weakMemo((dataRequest: DataRequest) => {
    return {
        logs: buildLogFilter(dataRequest),
        transactions: buildTransactionFilter(dataRequest),
        traces: buildTraceFilter(dataRequest),
        stateDiffs: buildStateDiffFilter(dataRequest)
    }
})


class IncludeSet {
    logs = new Set<Log>()
    transactions = new Set<Transaction>()
    traces = new Set<Trace>()
    stateDiffs = new Set<StateDiff>()

    addLog(log?: Log): void {
        if (log) this.logs.add(log)
    }

    addTransaction(tx?: Transaction): void {
        if (tx) this.transactions.add(tx)
    }

    addTrace(trace?: Trace): void {
        if (trace) this.traces.add(trace)
    }

    addTraceStack(trace?: Trace): void {
        while (trace) {
            this.traces.add(trace)
            trace = trace.parent
        }
    }

    addStateDiff(diff?: StateDiff): void {
        if (diff) this.stateDiffs.add(diff)
    }
}


export function filterBlock(block: Block, dataRequest: DataRequest): void {
    let items = getItemFilter(dataRequest)

    let logsByTransaction = groupBy(block.logs, log => log.transactionIndex)
    let tracesByTransaction = groupBy(block.traces, trace => trace.transactionIndex)
    let stateDiffsByTransaction = groupBy(block.stateDiffs, diff => diff.transactionIndex)

    let include = new IncludeSet()
    
    if (items.logs.present()) {
        for (let log of block.logs) {
            let rel = items.logs.match(log)
            if (rel == null) continue
            include.addLog(log)
            if (rel.transaction) {
                include.addTransaction(log.transaction)
            }
            if (rel.transactionLogs) {
                let logs = logsByTransaction.get(log.transactionIndex) ?? []
                for (let sibling of logs) {
                    include.addLog(sibling)
                }
            }
            if (rel.transactionTraces) {
                let traces = tracesByTransaction.get(log.transactionIndex) ?? []
                for (let trace of traces) {
                    include.addTrace(trace)
                }
            }
            if (rel.transactionStateDiffs) {
                let stateDiffs = stateDiffsByTransaction.get(log.transactionIndex) ?? []
                for (let diff of stateDiffs) {
                    include.addStateDiff(diff)
                }
            }
        }
    }

    if (items.transactions.present()) {
        for (let tx of block.transactions) {
            let rel = items.transactions.match(tx)
            if (rel == null) continue
            include.addTransaction(tx)
            if (rel.logs) {
                for (let log of tx.logs) {
                    include.addLog(log)
                }
            }
            if (rel.traces) {
                for (let trace of tx.traces) {
                    include.addTrace(trace)
                }
            }
            if (rel.stateDiffs) {
                for (let diff of tx.stateDiffs) {
                    include.addStateDiff(diff)
                }
            }
        }
    }

    if (items.traces.present()) {
        for (let trace of block.traces) {
            let rel = items.traces.match(trace)
            if (rel == null) continue
            include.addTrace(trace)
            if (rel.parents) {
                include.addTraceStack(trace.parent)
            }
            if (rel.subtraces) {
                for (let sub of trace.children) {
                    include.addTrace(sub)
                }
            }
            if (rel.transaction) {
                include.addTransaction(trace.transaction)
            }
            if (rel.transactionLogs) {
                let logs = logsByTransaction.get(trace.transactionIndex) ?? []
                for (let log of logs) {
                    include.addLog(log)
                }
            }
        }
    }

    if (items.stateDiffs.present()) {
        for (let diff of block.stateDiffs) {
            let rel = items.stateDiffs.match(diff)
            if (rel == null) continue
            include.addStateDiff(diff)
            if (rel.transaction) {
                include.addTransaction(diff.transaction)
            }
        }
    }

    block.logs = block.logs.filter(log => {
        if (!include.logs.has(log)) return false
        if (log.transaction && !include.transactions.has(log.transaction)) {
            log.transaction = undefined
        }
        return true
    })

    block.transactions = block.transactions.filter(tx => {
        if (!include.transactions.has(tx)) return false
        tx.logs = tx.logs.filter(it => include.logs.has(it))
        tx.traces = tx.traces.filter(it => include.traces.has(it))
        tx.stateDiffs = tx.stateDiffs.filter(it => include.stateDiffs.has(it))
        return true
    })

    block.traces = block.traces.filter(trace => {
        if (!include.traces.has(trace)) return false
        if (trace.transaction && !include.transactions.has(trace.transaction)) {
            trace.transaction = undefined
        }
        if (trace.parent && !include.traces.has(trace.parent)) {
            trace.parent = undefined
        }
        trace.children = trace.children.filter(it => include.traces.has(it))
        return true
    })

    block.stateDiffs = block.stateDiffs.filter(diff => {
        if (!include.stateDiffs.has(diff)) return false
        if (diff.transaction && !include.transactions.has(diff.transaction)) {
            diff.transaction = undefined
        }
        return true
    })
}
