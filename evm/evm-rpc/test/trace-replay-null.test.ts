import { describe, it, expect } from 'vitest'
import { array } from '@subsquid/util-internal-validation'
import { getTraceTransactionReplayValidator } from '../src/rpc-data'

// Regression for a dump crash-loop: some providers return `stateDiff: null`
// (or `trace: null`) for an individual transaction inside an otherwise valid
// `trace_replayBlockTransactions` 200 response. Before the fix the per-tx
// validator required a non-null object and threw a fatal DataValidationError
// ("invalid value at /0/stateDiff: null is not an object"), crashing ingestion.
describe('trace_replayBlockTransactions per-tx null tolerance', () => {
    it('accepts a per-tx null stateDiff when stateDiff is requested', () => {
        const validator = array(getTraceTransactionReplayValidator({ trace: true, stateDiff: true }))
        const response = [
            {
                transactionHash: '0x' + 'ab'.repeat(32),
                trace: [],
                stateDiff: null,
            },
        ]
        expect(validator.validate(response)).toBeUndefined()
    })

    it('accepts a per-tx null trace when trace is requested', () => {
        const validator = array(getTraceTransactionReplayValidator({ trace: true, stateDiff: true }))
        const response = [
            {
                transactionHash: '0x' + 'cd'.repeat(32),
                trace: null,
                stateDiff: {},
            },
        ]
        expect(validator.validate(response)).toBeUndefined()
    })
})
