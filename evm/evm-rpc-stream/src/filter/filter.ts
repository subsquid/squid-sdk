import {Block, Log, StateDiff, Trace, Transaction} from '@subsquid/evm-stream'
import {assertNotNull, groupBy} from '@subsquid/util-internal'
import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'

import {
    FlatDataRequest,
    FlatLogRequest,
    FlatStateDiffRequest,
    FlatTraceRequest,
    FlatTransactionRequest,
} from './request'

type AnyBlock = Block<any>
type AnyLog = Log<any>
type AnyTransaction = Transaction<any>
type AnyTrace = Trace<any>
type AnyStateDiff = StateDiff<any>

/**
 * Trace relations for the flat `Block<F>` model. The Portal/processor models carry
 * these as object pointers on the items themselves; on the flat model we keep them in
 * side-maps so the yielded blocks stay plain projections (nothing transient to strip).
 *
 * `children` holds every descendant of a trace (not just direct), and `parent` the
 * direct parent — matching the legacy `setUpRelations` semantics we ported.
 */
export interface Relations {
    txByIndex: Map<number, AnyTransaction>
    logsByTx: Map<number, AnyLog[]>
    tracesByTx: Map<number, AnyTrace[]>
    stateDiffsByTx: Map<number, AnyStateDiff[]>
    traceParent: Map<AnyTrace, AnyTrace>
    traceChildren: Map<AnyTrace, AnyTrace[]>
}

function traceAddressOf(trace: AnyTrace): number[] {
    return (trace as any).traceAddress ?? []
}

function traceCompare(a: AnyTrace, b: AnyTrace): number {
    return a.transactionIndex - b.transactionIndex || addressCompare(traceAddressOf(a), traceAddressOf(b))
}

function addressCompare(a: number[], b: number[]): number {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        let order = a[i] - b[i]
        if (order) return order
    }

    return a.length - b.length
}

function isDescendent(parent: AnyTrace, child: AnyTrace): boolean {
    let pa = traceAddressOf(parent)
    let ca = traceAddressOf(child)
    if (parent.transactionIndex != child.transactionIndex) return false
    if (pa.length >= ca.length) return false
    for (let i = 0; i < pa.length; i++) {
        if (pa[i] != ca[i]) return false
    }

    return true
}

/**
 * Build the relation side-maps for a block. Sorts traces canonically (by
 * transactionIndex then traceAddress) so the descendant scan can stop at the first
 * non-descendant, exactly as the legacy `setUpRelations` does.
 */
export function setUpRelations(block: AnyBlock): Relations {
    let traces = [...block.traces].sort(traceCompare)

    let relations: Relations = {
        txByIndex: new Map(block.transactions.map((tx) => [tx.transactionIndex, tx])),
        logsByTx: groupBy(block.logs, (log) => log.transactionIndex),
        tracesByTx: groupBy(traces, (trace) => trace.transactionIndex),
        stateDiffsByTx: groupBy(block.stateDiffs, (diff) => diff.transactionIndex),
        traceParent: new Map(),
        traceChildren: new Map(),
    }

    for (let i = 0; i < traces.length; i++) {
        let rec = traces[i]
        let children: AnyTrace[] = []
        for (let j = i + 1; j < traces.length; j++) {
            let next = traces[j]
            if (isDescendent(rec, next)) {
                children.push(next)
                if (traceAddressOf(next).length == traceAddressOf(rec).length + 1) {
                    relations.traceParent.set(next, rec)
                }
            } else {
                break
            }
        }
        relations.traceChildren.set(rec, children)
    }

    return relations
}

function buildLogFilter(req: FlatLogRequest[] = []): EntityFilter<
    AnyLog,
    {transaction?: boolean; transactionLogs?: boolean; transactionStateDiffs?: boolean; transactionTraces?: boolean}
> {
    let items = new EntityFilter()
    for (let {address, topic0, topic1, topic2, topic3, ...relations} of req) {
        let filter = new FilterBuilder<AnyLog>()
        filter.propIn('address', address)
        filter.getIn((log) => assertNotNull((log as any).topics)[0], topic0)
        filter.getIn((log) => assertNotNull((log as any).topics)[1], topic1)
        filter.getIn((log) => assertNotNull((log as any).topics)[2], topic2)
        filter.getIn((log) => assertNotNull((log as any).topics)[3], topic3)
        items.add(filter, relations)
    }

    return items
}

function buildTransactionFilter(
    req: FlatTransactionRequest[] = [],
): EntityFilter<AnyTransaction, {logs?: boolean; traces?: boolean; stateDiffs?: boolean}> {
    let items = new EntityFilter()
    for (let {to, from, sighash, type, ...relations} of req) {
        let filter = new FilterBuilder<AnyTransaction>()
        filter.propIn('to' as any, to)
        filter.propIn('from' as any, from)
        filter.propIn('sighash' as any, sighash)
        filter.propIn('type' as any, type)
        items.add(filter, relations)
    }

    return items
}

function buildTraceFilter(
    req: FlatTraceRequest[] = [],
): EntityFilter<AnyTrace, {transaction?: boolean; transactionLogs?: boolean; subtraces?: boolean; parents?: boolean}> {
    let items = new EntityFilter()
    for (let {type, createFrom, callTo, callFrom, callSighash, suicideRefundAddress, rewardAuthor, ...relations} of req) {
        let filter = new FilterBuilder<AnyTrace>()
        filter.propIn('type', type as AnyTrace['type'][])
        filter.getIn((t) => t.type === 'create' && assertNotNull((t as any).action?.from), createFrom)
        filter.getIn((t) => t.type === 'call' && assertNotNull((t as any).action?.to), callTo)
        filter.getIn((t) => t.type === 'call' && assertNotNull((t as any).action?.from), callFrom)
        filter.getIn((t) => t.type === 'call' && assertNotNull((t as any).action?.sighash), callSighash)
        filter.getIn((t) => t.type === 'suicide' && assertNotNull((t as any).action?.refundAddress), suicideRefundAddress)
        filter.getIn((t) => t.type === 'reward' && assertNotNull((t as any).action?.author), rewardAuthor)
        items.add(filter, relations)
    }

    return items
}

function buildStateDiffFilter(req: FlatStateDiffRequest[] = []): EntityFilter<AnyStateDiff, {transaction?: boolean}> {
    let items = new EntityFilter()
    for (let {address, key, kind, ...relations} of req) {
        let filter = new FilterBuilder<AnyStateDiff>()
        filter.propIn('address', address)
        filter.propIn('key' as any, key)
        filter.propIn('kind' as any, kind)
        items.add(filter, relations)
    }

    return items
}

class IncludeSet {
    logs = new Set<AnyLog>()
    transactions = new Set<AnyTransaction>()
    traces = new Set<AnyTrace>()
    stateDiffs = new Set<AnyStateDiff>()

    addLog(log?: AnyLog): void {
        if (log) this.logs.add(log)
    }
    addTransaction(tx?: AnyTransaction): void {
        if (tx) this.transactions.add(tx)
    }
    addTrace(trace?: AnyTrace): void {
        if (trace) this.traces.add(trace)
    }
    addTraceStack(relations: Relations, trace?: AnyTrace): void {
        while (trace) {
            this.traces.add(trace)
            trace = relations.traceParent.get(trace)
        }
    }
    addStateDiff(diff?: AnyStateDiff): void {
        if (diff) this.stateDiffs.add(diff)
    }
}

/**
 * Filter a flat `Block<F>` in place to the items matched by `req` plus their requested
 * relations — the client-side equivalent of the Portal server's filtering. Ported from
 * the legacy `@subsquid/evm-processor` `ds-rpc/filter.ts` onto the flat model: relation
 * navigation goes through `relations` side-maps instead of item pointers, and there are
 * no cross-pointers to null out after filtering.
 */
export function filterBlock(block: AnyBlock, req: FlatDataRequest, relations: Relations): void {
    let logFilter = buildLogFilter(req.logs)
    let transactionFilter = buildTransactionFilter(req.transactions)
    let traceFilter = buildTraceFilter(req.traces)
    let stateDiffFilter = buildStateDiffFilter(req.stateDiffs)

    let include = new IncludeSet()

    if (logFilter.present()) {
        for (let log of block.logs) {
            let rel = logFilter.match(log)
            if (rel == null) continue
            include.addLog(log)
            if (rel.transaction) {
                include.addTransaction(relations.txByIndex.get(log.transactionIndex))
            }
            if (rel.transactionLogs) {
                for (let sibling of relations.logsByTx.get(log.transactionIndex) ?? []) {
                    include.addLog(sibling)
                }
            }
            if (rel.transactionTraces) {
                for (let trace of relations.tracesByTx.get(log.transactionIndex) ?? []) {
                    include.addTrace(trace)
                }
            }
            if (rel.transactionStateDiffs) {
                for (let diff of relations.stateDiffsByTx.get(log.transactionIndex) ?? []) {
                    include.addStateDiff(diff)
                }
            }
        }
    }

    if (transactionFilter.present()) {
        for (let tx of block.transactions) {
            let rel = transactionFilter.match(tx)
            if (rel == null) continue
            include.addTransaction(tx)
            if (rel.logs) {
                for (let log of relations.logsByTx.get(tx.transactionIndex) ?? []) {
                    include.addLog(log)
                }
            }
            if (rel.traces) {
                for (let trace of relations.tracesByTx.get(tx.transactionIndex) ?? []) {
                    include.addTrace(trace)
                }
            }
            if (rel.stateDiffs) {
                for (let diff of relations.stateDiffsByTx.get(tx.transactionIndex) ?? []) {
                    include.addStateDiff(diff)
                }
            }
        }
    }

    if (traceFilter.present()) {
        for (let trace of block.traces) {
            let rel = traceFilter.match(trace)
            if (rel == null) continue
            include.addTrace(trace)
            if (rel.parents) {
                include.addTraceStack(relations, relations.traceParent.get(trace))
            }
            if (rel.subtraces) {
                for (let sub of relations.traceChildren.get(trace) ?? []) {
                    include.addTrace(sub)
                }
            }
            if (rel.transaction) {
                include.addTransaction(relations.txByIndex.get(trace.transactionIndex))
            }
            if (rel.transactionLogs) {
                for (let log of relations.logsByTx.get(trace.transactionIndex) ?? []) {
                    include.addLog(log)
                }
            }
        }
    }

    if (stateDiffFilter.present()) {
        for (let diff of block.stateDiffs) {
            let rel = stateDiffFilter.match(diff)
            if (rel == null) continue
            include.addStateDiff(diff)
            if (rel.transaction) {
                include.addTransaction(relations.txByIndex.get(diff.transactionIndex))
            }
        }
    }

    block.logs = block.logs.filter((log) => include.logs.has(log))
    block.transactions = block.transactions.filter((tx) => include.transactions.has(tx))
    block.traces = block.traces.filter((trace) => include.traces.has(trace))
    block.stateDiffs = block.stateDiffs.filter((diff) => include.stateDiffs.has(diff))
}
