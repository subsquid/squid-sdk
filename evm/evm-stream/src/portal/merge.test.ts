import { describe, it } from 'vitest'
import assert from 'assert'
import {mergeItems, LOG_FILTER_KEYS, TX_FILTER_KEYS, TRACE_FILTER_KEYS, STATE_DIFF_FILTER_KEYS} from './merge'

describe('mergeItems', function () {
    describe('logs', function () {
        it('merges logs with same topics but different addresses', function () {
            let result = mergeItems([
                {address: ['0xAAA'], topic0: ['0xTransfer'], transaction: true},
                {address: ['0xBBB'], topic0: ['0xTransfer'], transaction: true},
                {address: ['0xCCC'], topic0: ['0xTransfer'], transaction: true},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].address?.sort(), ['0xAAA', '0xBBB', '0xCCC'])
            assert.deepStrictEqual(result[0].topic0, ['0xTransfer'])
            assert.strictEqual(result[0].transaction, true)
        })

        it('merges logs with same address but different topics', function () {
            let result = mergeItems([
                {address: ['0xAAA'], topic0: ['0xTransfer']},
                {address: ['0xAAA'], topic0: ['0xApproval']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].address, ['0xAAA'])
            assert.deepStrictEqual(result[0].topic0?.sort(), ['0xApproval', '0xTransfer'])
        })

        it('does not merge logs differing in two filter fields', function () {
            let result = mergeItems([
                {address: ['0xAAA'], topic0: ['0xTransfer']},
                {address: ['0xBBB'], topic0: ['0xApproval']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })

        it('does not merge logs with different relation flags', function () {
            let result = mergeItems([
                {address: ['0xAAA'], topic0: ['0xTransfer'], transaction: true},
                {address: ['0xBBB'], topic0: ['0xTransfer'], transactionLogs: true},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })

        it('deduplicates identical requests', function () {
            let result = mergeItems([
                {address: ['0xAAA'], topic0: ['0xTransfer']},
                {address: ['0xAAA'], topic0: ['0xTransfer']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
        })

        it('subsumes narrower filter when wider one has undefined field', function () {
            let result = mergeItems([
                {topic0: ['0xTransfer']},
                {address: ['0xAAA'], topic0: ['0xTransfer']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].address, undefined)
            assert.deepStrictEqual(result[0].topic0, ['0xTransfer'])
        })

        it('deduplicates addresses across merged requests', function () {
            let result = mergeItems([
                {address: ['0xAAA', '0xBBB'], topic0: ['0xTransfer']},
                {address: ['0xBBB', '0xCCC'], topic0: ['0xTransfer']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].address?.sort(), ['0xAAA', '0xBBB', '0xCCC'])
        })

        it('returns single request as-is', function () {
            let result = mergeItems([
                {address: ['0xAAA'], transaction: true},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].address, ['0xAAA'])
        })

        it('handles empty array', function () {
            let result = mergeItems([], LOG_FILTER_KEYS)
            assert.deepStrictEqual(result, [])
        })

        it('performs multi-pass merging', function () {
            let result = mergeItems([
                {address: ['0xAAA'], topic0: ['0xT1']},
                {address: ['0xBBB'], topic0: ['0xT2']},
                {address: ['0xAAA'], topic0: ['0xT2']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })
    })

    describe('transactions', function () {
        it('merges transactions with same sighash but different to addresses', function () {
            let result = mergeItems([
                {to: ['0xAAA'], sighash: ['0x12345678']},
                {to: ['0xBBB'], sighash: ['0x12345678']},
            ], TX_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].to?.sort(), ['0xAAA', '0xBBB'])
            assert.deepStrictEqual(result[0].sighash, ['0x12345678'])
        })
    })

    describe('traces', function () {
        it('merges traces with same type but different callTo', function () {
            let result = mergeItems([
                {type: ['call'], callTo: ['0xAAA']},
                {type: ['call'], callTo: ['0xBBB']},
            ], TRACE_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].callTo?.sort(), ['0xAAA', '0xBBB'])
        })
    })

    describe('stateDiffs', function () {
        it('merges stateDiffs with same kind but different addresses', function () {
            let result = mergeItems([
                {address: ['0xAAA'], kind: ['*']},
                {address: ['0xBBB'], kind: ['*']},
            ], STATE_DIFF_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].address?.sort(), ['0xAAA', '0xBBB'])
        })
    })
})
