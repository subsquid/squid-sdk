import {describe, expect, it} from 'vitest'

import {flattenRequest, toRequiredData, unionRequiredData} from './request'

describe('flattenRequest', () => {
    it('spreads where + include into a single object per item', () => {
        let flat = flattenRequest({
            logs: [{where: {address: ['0xa'], topic0: ['0xt']}, include: {transaction: true}}],
            transactions: [{where: {to: ['0xb']}, include: {logs: true}}],
        })

        expect(flat.logs).toEqual([{address: ['0xa'], topic0: ['0xt'], transaction: true}])
        expect(flat.transactions).toEqual([{to: ['0xb'], logs: true}])
    })

    it('preserves includeAllBlocks and tolerates missing where/include', () => {
        let flat = flattenRequest({includeAllBlocks: true, traces: [{}]})
        expect(flat.includeAllBlocks).toBe(true)
        expect(flat.traces).toEqual([{}])
    })
})

describe('toRequiredData', () => {
    it('requests nothing for an empty request', () => {
        // No `transactions` toggle: the RPC source always fetches full transactions (mapRpcBlock
        // needs them), so it isn't derived here.
        expect(toRequiredData({}, {})).toEqual({
            logs: false,
            receipts: false,
            traces: false,
            stateDiffs: false,
        })
    })

    it('logs filter without receipt fields requests logs, not receipts', () => {
        let req = toRequiredData({logs: [{address: ['0xa']}]}, {})
        expect(req.logs).toBe(true)
        expect(req.receipts).toBe(false)
    })

    it('requested receipt fields set receipts; logs stays the RAW need (dedup is deferred to the union)', () => {
        // A transaction filter + a receipt-only field (gasUsed) ⇒ receipts. `toRequiredData` reports
        // the raw `logs` need unchanged; the "served via receipts, skip eth_getLogs" suppression is
        // the union's job, not this per-request function's.
        let req = toRequiredData(
            {transactions: [{to: ['0xb']}], logs: [{address: ['0xa']}]},
            {transaction: {gasUsed: true}},
        )
        expect(req.receipts).toBe(true)
        expect(req.logs).toBe(true)
    })

    it('derives traces and stateDiffs from relation includes', () => {
        let req = toRequiredData(
            {
                transactions: [{to: ['0xb'], traces: true}],
                logs: [{address: ['0xa'], transactionStateDiffs: true}],
            },
            {},
        )
        expect(req.traces).toBe(true)
        expect(req.stateDiffs).toBe(true)
    })
})

describe('unionRequiredData', () => {
    it('ORs the per-request needs across the list', () => {
        let acc = unionRequiredData(
            [{logs: [{address: ['0xa']}]}, {traces: [{callTo: ['0xb']}]}],
            {},
        )
        expect(acc).toEqual({logs: true, receipts: false, traces: true, stateDiffs: false})
    })

    it('suppresses the separate logs fetch when the aggregate pulls receipts (single request)', () => {
        // Receipts already carry the block's logs, so no separate eth_getLogs is needed.
        let acc = unionRequiredData(
            [{transactions: [{to: ['0xb']}], logs: [{address: ['0xa']}]}],
            {transaction: {gasUsed: true}},
        )
        expect(acc).toEqual({logs: false, receipts: true, traces: false, stateDiffs: false})
    })

    it('applies the logs↔receipts dedup on the AGGREGATE, not per-request (regression for #510)', () => {
        // Request A wants logs but no receipt fields (→ raw logs, no receipts); request B pulls
        // receipts. Pre-fix, A's logs and B's receipts each survived the per-request suppression and
        // OR-ed to {logs:true, receipts:true} — a redundant eth_getLogs every stride. The dedup must
        // see the whole list: because *something* pulls receipts, the separate logs fetch is dropped.
        let acc = unionRequiredData(
            [{logs: [{address: ['0xa']}]}, {transactions: [{to: ['0xb']}]}],
            {transaction: {gasUsed: true}},
        )
        expect(acc).toEqual({logs: false, receipts: true, traces: false, stateDiffs: false})
    })
})
