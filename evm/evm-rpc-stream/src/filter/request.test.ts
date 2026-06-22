import {describe, expect, it} from 'vitest'

import {flattenRequest, toRequiredData} from './request'

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
        expect(toRequiredData({}, {})).toEqual({
            transactions: false,
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

    it('a log filter that includes the transaction forces transaction fetching', () => {
        let req = toRequiredData({logs: [{address: ['0xa'], transaction: true}]}, {transaction: {from: true}})
        expect(req.transactions).toBe(true)
    })

    it('requested receipt fields upgrade logs to receipts', () => {
        // A transaction filter + a receipt-only field (gasUsed) ⇒ receipts, and logs are
        // served via receipts rather than eth_getLogs.
        let req = toRequiredData(
            {transactions: [{to: ['0xb']}], logs: [{address: ['0xa']}]},
            {transaction: {gasUsed: true}},
        )
        expect(req.receipts).toBe(true)
        expect(req.logs).toBe(false)
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
