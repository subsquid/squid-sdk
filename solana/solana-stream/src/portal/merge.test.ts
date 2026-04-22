import {describe, it} from 'node:test'
import assert from 'assert'
import {
    mergeItems,
    TX_FILTER_KEYS,
    INSTRUCTION_FILTER_KEYS,
    LOG_FILTER_KEYS,
    BALANCE_FILTER_KEYS,
    TOKEN_BALANCE_FILTER_KEYS,
    REWARD_FILTER_KEYS,
} from './merge'

describe('mergeItems', function () {
    describe('instructions', function () {
        it('merges instructions with same discriminator but different programIds', function () {
            let result = mergeItems([
                {programId: ['ProgA'], discriminator: ['0x01'], transaction: true},
                {programId: ['ProgB'], discriminator: ['0x01'], transaction: true},
                {programId: ['ProgC'], discriminator: ['0x01'], transaction: true},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].programId?.sort(), ['ProgA', 'ProgB', 'ProgC'])
            assert.deepStrictEqual(result[0].discriminator, ['0x01'])
            assert.strictEqual(result[0].transaction, true)
        })

        it('merges instructions with same programId but different discriminators', function () {
            let result = mergeItems([
                {programId: ['ProgA'], discriminator: ['0x01']},
                {programId: ['ProgA'], discriminator: ['0x02']},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].programId, ['ProgA'])
            assert.deepStrictEqual(result[0].discriminator?.sort(), ['0x01', '0x02'])
        })

        it('does not merge instructions differing in two filter fields', function () {
            let result = mergeItems([
                {programId: ['ProgA'], discriminator: ['0x01']},
                {programId: ['ProgB'], discriminator: ['0x02']},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })

        it('does not merge instructions with different relation flags', function () {
            let result = mergeItems([
                {programId: ['ProgA'], discriminator: ['0x01'], transaction: true},
                {programId: ['ProgB'], discriminator: ['0x01'], logs: true},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })

        it('merges instructions with same programId and account filters', function () {
            let result = mergeItems([
                {programId: ['ProgA'], a0: ['Acc1']},
                {programId: ['ProgA'], a0: ['Acc2']},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].programId, ['ProgA'])
            assert.deepStrictEqual(result[0].a0?.sort(), ['Acc1', 'Acc2'])
        })

        it('subsumes narrower filter when wider one has undefined programId', function () {
            let result = mergeItems([
                {discriminator: ['0x01']},
                {programId: ['ProgA'], discriminator: ['0x01']},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.strictEqual(result[0].programId, undefined)
            assert.deepStrictEqual(result[0].discriminator, ['0x01'])
        })

        it('deduplicates identical requests', function () {
            let result = mergeItems([
                {programId: ['ProgA'], discriminator: ['0x01']},
                {programId: ['ProgA'], discriminator: ['0x01']},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
        })
    })

    describe('logs', function () {
        it('merges logs with same kind but different programIds', function () {
            let result = mergeItems([
                {programId: ['ProgA'], kind: ['log'], transaction: true},
                {programId: ['ProgB'], kind: ['log'], transaction: true},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].programId?.sort(), ['ProgA', 'ProgB'])
            assert.deepStrictEqual(result[0].kind, ['log'])
            assert.strictEqual(result[0].transaction, true)
        })

        it('merges logs with same programId but different kinds', function () {
            let result = mergeItems([
                {programId: ['ProgA'], kind: ['log']},
                {programId: ['ProgA'], kind: ['data']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].programId, ['ProgA'])
            assert.deepStrictEqual(result[0].kind?.sort(), ['data', 'log'])
        })

        it('does not merge logs differing in two filter fields', function () {
            let result = mergeItems([
                {programId: ['ProgA'], kind: ['log']},
                {programId: ['ProgB'], kind: ['data']},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })

        it('does not merge logs with different relation flags', function () {
            let result = mergeItems([
                {programId: ['ProgA'], transaction: true},
                {programId: ['ProgB'], instruction: true},
            ], LOG_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })
    })

    describe('transactions', function () {
        it('merges transactions with different feePayers', function () {
            let result = mergeItems([
                {feePayer: ['PayerA'], instructions: true},
                {feePayer: ['PayerB'], instructions: true},
            ], TX_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].feePayer?.sort(), ['PayerA', 'PayerB'])
            assert.strictEqual(result[0].instructions, true)
        })

        it('does not merge transactions with different relation flags', function () {
            let result = mergeItems([
                {feePayer: ['PayerA'], instructions: true},
                {feePayer: ['PayerB'], logs: true},
            ], TX_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })
    })

    describe('balances', function () {
        it('merges balances with different accounts', function () {
            let result = mergeItems([
                {account: ['Acc1'], transaction: true},
                {account: ['Acc2'], transaction: true},
            ], BALANCE_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].account?.sort(), ['Acc1', 'Acc2'])
            assert.strictEqual(result[0].transaction, true)
        })

        it('does not merge balances with different relation flags', function () {
            let result = mergeItems([
                {account: ['Acc1'], transaction: true},
                {account: ['Acc2'], transactionInstructions: true},
            ], BALANCE_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })

        it('deduplicates accounts across merged requests', function () {
            let result = mergeItems([
                {account: ['Acc1', 'Acc2']},
                {account: ['Acc2', 'Acc3']},
            ], BALANCE_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].account?.sort(), ['Acc1', 'Acc2', 'Acc3'])
        })
    })

    describe('tokenBalances', function () {
        it('merges tokenBalances with same mint but different accounts', function () {
            let result = mergeItems([
                {account: ['Acc1'], preMint: ['MintA']},
                {account: ['Acc2'], preMint: ['MintA']},
            ], TOKEN_BALANCE_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].account?.sort(), ['Acc1', 'Acc2'])
            assert.deepStrictEqual(result[0].preMint, ['MintA'])
        })

        it('does not merge tokenBalances differing in two filter fields', function () {
            let result = mergeItems([
                {account: ['Acc1'], preMint: ['MintA']},
                {account: ['Acc2'], preMint: ['MintB']},
            ], TOKEN_BALANCE_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })

        it('merges tokenBalances with same account but different mints', function () {
            let result = mergeItems([
                {account: ['Acc1'], preMint: ['MintA']},
                {account: ['Acc1'], preMint: ['MintB']},
            ], TOKEN_BALANCE_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].account, ['Acc1'])
            assert.deepStrictEqual(result[0].preMint?.sort(), ['MintA', 'MintB'])
        })
    })

    describe('rewards', function () {
        it('merges rewards with different pubkeys', function () {
            let result = mergeItems([
                {pubkey: ['PubA']},
                {pubkey: ['PubB']},
            ], REWARD_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].pubkey?.sort(), ['PubA', 'PubB'])
        })

        it('deduplicates identical reward requests', function () {
            let result = mergeItems([
                {pubkey: ['PubA']},
                {pubkey: ['PubA']},
            ], REWARD_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].pubkey, ['PubA'])
        })
    })

    describe('general', function () {
        it('returns single request as-is', function () {
            let result = mergeItems([
                {programId: ['ProgA'], transaction: true},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].programId, ['ProgA'])
        })

        it('handles empty array', function () {
            let result = mergeItems([], INSTRUCTION_FILTER_KEYS)
            assert.deepStrictEqual(result, [])
        })

        it('performs multi-pass merging', function () {
            let result = mergeItems([
                {programId: ['ProgA'], discriminator: ['0x01']},
                {programId: ['ProgB'], discriminator: ['0x02']},
                {programId: ['ProgA'], discriminator: ['0x02']},
            ], INSTRUCTION_FILTER_KEYS)
            assert.strictEqual(result.length, 2)
        })
    })
})
