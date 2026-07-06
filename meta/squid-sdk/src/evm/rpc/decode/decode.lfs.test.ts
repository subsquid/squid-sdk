import {FieldSelection} from '@subsquid/evm-stream'
import * as fs from 'fs'
import * as Path from 'path'
import {describe, expect, it} from 'vitest'

import {decodeWireBlock} from './decode'

/**
 * Real-data decode test (plan §10 / parity test #8, offline half). The evm-normalization
 * fixture `result.json` is exactly `toJSON(mapRpcBlock(block.json))` — i.e. the wire input
 * to our decode pipeline — for Ethereum mainnet block 22000000. We run the full pipeline
 * (shim → cast(getBlockSchema) → mapBlock) on it and assert the cast succeeds (the decoder
 * reuse holds on real data) and the output is shaped as the Portal source would produce.
 *
 * LFS-gated: the fixture is a git-lfs object. Run with `VITEST_LFS=1` after `git lfs pull`.
 */

const WIRE = Path.resolve(__dirname, '../../../evm-normalization/fixtures/22000000/result.json')

const FIELDS = {
    block: {timestamp: true, gasUsed: true, miner: true},
    transaction: {from: true, to: true, value: true, gasUsed: true, status: true},
    log: {address: true, topics: true, data: true},
    trace: {callFrom: true, callTo: true, callValue: true, createResultAddress: true},
    stateDiff: {kind: true, prev: true, next: true},
} satisfies FieldSelection

describe('decodeWireBlock — mainnet block 22000000', () => {
    let wire = JSON.parse(fs.readFileSync(WIRE, 'utf-8'))

    it('decodes via the reused Portal decoder', () => {
        let block = decodeWireBlock(wire, FIELDS)

        // Header: number/hash always present; height aliases number; timestamp → ms.
        expect(block.header.number).toBe(22000000)
        expect((block.header as any).height).toBe(22000000)
        expect(typeof block.header.hash).toBe('string')
        // Normalized timestamp is seconds; mapBlock multiplies by 1000.
        expect(block.header.timestamp).toBe(wire.header.timestamp * 1000)

        // Counts match the fixture exactly (no item dropped/duplicated by decode).
        expect(block.transactions).toHaveLength(wire.transactions.length)
        expect(block.logs).toHaveLength(wire.logs.length)
        expect(block.traces).toHaveLength(wire.traces.length)
        expect(block.stateDiffs).toHaveLength(wire.stateDiffs.length)
    })

    it('preserves required index fields and projects selected fields', () => {
        let block = decodeWireBlock(wire, FIELDS)

        let tx = block.transactions[0] as any
        expect(tx.transactionIndex).toBe(0)
        expect(typeof tx.from).toBe('string')
        // bigint-decoded quantity (Qty → bigint by the shared codec).
        expect(typeof tx.value).toBe('bigint')

        let log = block.logs[0] as any
        expect(typeof log.logIndex).toBe('number')
        expect(typeof log.transactionIndex).toBe('number')
        expect(Array.isArray(log.topics)).toBe(true)

        let trace = block.traces[0] as any
        expect(['call', 'create']).toContain(trace.type)
        expect(Array.isArray(trace.traceAddress)).toBe(true)
    })
})
