import {describe, expect, it} from 'vitest'

import {filterBlock, setUpRelations} from './filter'
import {FlatDataRequest} from './request'

/**
 * Hand-built flat blocks + an independent expectation of Portal filter semantics
 * (per plan §12a — the unit oracle, not golden Portal dumps). Items carry only the
 * fields the filter reads; `as any` keeps the focus on filter behaviour, not the
 * full field-selection types.
 */

function log(transactionIndex: number, address: string, topics: string[] = []): any {
    return {logIndex: transactionIndex * 10, transactionIndex, address, topics}
}

function tx(transactionIndex: number, props: {to?: string; from?: string; sighash?: string; type?: number} = {}): any {
    return {transactionIndex, ...props}
}

function callTrace(transactionIndex: number, traceAddress: number[], action: any = {}): any {
    // Real call traces always carry an action.to/from; default them so a `callTo`
    // filter never trips assertNotNull on an unrelated, well-formed trace.
    return {transactionIndex, traceAddress, type: 'call', action: {to: '0x0', from: '0x0', ...action}}
}

function stateDiff(transactionIndex: number, address: string, key: string, kind = '='): any {
    return {transactionIndex, address, key, kind}
}

function makeBlock(parts: {transactions?: any[]; logs?: any[]; traces?: any[]; stateDiffs?: any[]} = {}): any {
    return {
        header: {number: 1, hash: '0x1', height: 1, parentHash: '0x0'},
        transactions: parts.transactions ?? [],
        logs: parts.logs ?? [],
        traces: parts.traces ?? [],
        stateDiffs: parts.stateDiffs ?? [],
    }
}

function run(block: any, req: FlatDataRequest) {
    filterBlock(block, req, setUpRelations(block))

    return block
}

describe('filterBlock — where clauses', () => {
    it('matches logs by address', () => {
        let block = makeBlock({logs: [log(0, '0xaaa'), log(1, '0xbbb'), log(2, '0xaaa')]})
        run(block, {logs: [{address: ['0xaaa']}]})
        expect(block.logs.map((l: any) => l.transactionIndex)).toEqual([0, 2])
    })

    it('matches logs by topic0', () => {
        let block = makeBlock({logs: [log(0, '0xaaa', ['0xt0']), log(1, '0xbbb', ['0xother'])]})
        run(block, {logs: [{topic0: ['0xt0']}]})
        expect(block.logs).toHaveLength(1)
        expect(block.logs[0].transactionIndex).toBe(0)
    })

    it('matches transactions by to/from', () => {
        let block = makeBlock({transactions: [tx(0, {to: '0xto'}), tx(1, {to: '0xother'}), tx(2, {from: '0xfrom'})]})
        run(block, {transactions: [{to: ['0xto']}, {from: ['0xfrom']}]})
        expect(block.transactions.map((t: any) => t.transactionIndex)).toEqual([0, 2])
    })

    it('matches traces by type', () => {
        let block = makeBlock({
            traces: [callTrace(0, []), {transactionIndex: 1, traceAddress: [], type: 'create', action: {}}],
        })
        run(block, {traces: [{type: ['create']}]})
        expect(block.traces).toHaveLength(1)
        expect(block.traces[0].type).toBe('create')
    })

    it('matches stateDiffs by address', () => {
        let block = makeBlock({stateDiffs: [stateDiff(0, '0xaaa', '0xk'), stateDiff(1, '0xbbb', '0xk')]})
        run(block, {stateDiffs: [{address: ['0xaaa']}]})
        expect(block.stateDiffs).toHaveLength(1)
        expect(block.stateDiffs[0].address).toBe('0xaaa')
    })

    it('empty where matches all items of that type', () => {
        let block = makeBlock({logs: [log(0, '0xaaa'), log(1, '0xbbb')]})
        run(block, {logs: [{}]})
        expect(block.logs).toHaveLength(2)
    })

    it('drops everything when nothing is requested', () => {
        let block = makeBlock({logs: [log(0, '0xaaa')], transactions: [tx(0)]})
        run(block, {})
        expect(block.logs).toHaveLength(0)
        expect(block.transactions).toHaveLength(0)
    })

    it('counts an item matched by several requests once (union)', () => {
        let block = makeBlock({logs: [log(0, '0xaaa', ['0xt0'])]})
        run(block, {logs: [{address: ['0xaaa']}, {topic0: ['0xt0']}]})
        expect(block.logs).toHaveLength(1)
    })
})

describe('filterBlock — relation expansion', () => {
    it('log → transaction pulls in the parent tx only', () => {
        let block = makeBlock({
            transactions: [tx(0, {to: '0xa'}), tx(1, {to: '0xb'})],
            logs: [log(0, '0xaaa')],
        })
        run(block, {logs: [{address: ['0xaaa'], transaction: true}]})
        expect(block.transactions.map((t: any) => t.transactionIndex)).toEqual([0])
    })

    it('transaction → logs/traces/stateDiffs pulls the tx siblings', () => {
        let block = makeBlock({
            transactions: [tx(0, {to: '0xa'})],
            logs: [log(0, '0xaaa'), log(0, '0xbbb')],
            traces: [callTrace(0, [])],
            stateDiffs: [stateDiff(0, '0xs', '0xk')],
        })
        run(block, {transactions: [{to: ['0xa'], logs: true, traces: true, stateDiffs: true}]})
        expect(block.logs).toHaveLength(2)
        expect(block.traces).toHaveLength(1)
        expect(block.stateDiffs).toHaveLength(1)
    })

    it('log → transactionTraces pulls sibling traces of the same tx', () => {
        let block = makeBlock({
            logs: [log(3, '0xaaa')],
            traces: [callTrace(3, []), callTrace(3, [0]), callTrace(4, [])],
        })
        run(block, {logs: [{address: ['0xaaa'], transactionTraces: true}]})
        expect(block.traces.map((t: any) => t.transactionIndex)).toEqual([3, 3])
    })
})

describe('setUpRelations + trace parents/subtraces', () => {
    it('expands parents up the traceAddress chain', () => {
        // Tree: [] → [0] → [0,0]; filter the leaf and ask for parents.
        let block = makeBlock({
            traces: [callTrace(0, []), callTrace(0, [0]), callTrace(0, [0, 0], {to: '0xleaf'})],
        })
        run(block, {traces: [{callTo: ['0xleaf'], parents: true}]})
        expect(block.traces.map((t: any) => t.traceAddress)).toEqual([[], [0], [0, 0]])
    })

    it('expands subtraces to all descendants', () => {
        let block = makeBlock({
            traces: [
                callTrace(0, [], {to: '0xroot'}),
                callTrace(0, [0]),
                callTrace(0, [0, 0]),
                callTrace(0, [1]),
            ],
        })
        run(block, {traces: [{callTo: ['0xroot'], subtraces: true}]})
        expect(block.traces).toHaveLength(4)
    })

    it('does not pull subtraces of an unrelated branch', () => {
        // Two independent roots; matching root [0] must not pull root [1]'s subtree.
        let block = makeBlock({
            traces: [callTrace(0, [0], {to: '0xrootA'}), callTrace(0, [0, 0]), callTrace(0, [1]), callTrace(0, [1, 0])],
        })
        run(block, {traces: [{callTo: ['0xrootA'], subtraces: true}]})
        expect(block.traces.map((t: any) => t.traceAddress)).toEqual([[0], [0, 0]])
    })
})
