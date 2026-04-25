import {type ForkException, isForkException} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'
import type {Rpc} from '../rpc'
import type {Block} from '../types'
import {ZERO_HASH} from '../types'
import {BitcoinRpcDataSource} from './rpc-data-source'
import type {IngestBatch} from './ingest'

// Mirrors evm-rpc's ensure-continuity.test.ts. Bitcoin uses
// `previousblockhash` (lowercase, Core RPC convention) instead of EVM's
// `parentHash`, and falls back to ZERO_HASH when the field is missing
// (genesis block) — both covered below.
const stubRpc = {getConcurrency: () => 1} as unknown as Rpc

function mkSource(): BitcoinRpcDataSource {
    return new BitcoinRpcDataSource({rpc: stubRpc, req: {}})
}

function mkBlock(number: number, hash: string, previousblockhash?: string): Block {
    return {
        number,
        hash,
        block: {hash, previousblockhash} as Block['block'],
    }
}

async function* yieldBatches(...batches: IngestBatch[]): AsyncIterable<IngestBatch> {
    for (const b of batches) yield b
}

async function drain(stream: AsyncIterable<IngestBatch>): Promise<{yielded: IngestBatch[]; error?: unknown}> {
    const yielded: IngestBatch[] = []
    try {
        for await (const batch of stream) {
            yielded.push(batch)
        }
    } catch (err) {
        return {yielded, error: err}
    }
    return {yielded}
}

describe('BitcoinRpcDataSource.ensureContinuity', () => {
    it('passes through a continuous chain untouched', async () => {
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(1, 'hash1', 'hash0'), mkBlock(2, 'hash2', 'hash1'), mkBlock(3, 'hash3', 'hash2')],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 1, 'hash0'))

        expect(error).toBeUndefined()
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['hash1', 'hash2', 'hash3'])
    })

    it('handles the genesis-block case where previousblockhash is absent (uses ZERO_HASH)', async () => {
        // Bitcoin's genesis block has no `previousblockhash` field in the RPC
        // response. ensureContinuity falls back to ZERO_HASH when constructing
        // the ForkException's previousBlocks entry so callers always see a
        // well-formed hash even in the genesis-mismatch case.
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(0, 'genesis', undefined)],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 0, 'something-non-null'))

        expect(yielded).toHaveLength(0) // mismatch at index 0, no prefix
        expect(isForkException(error)).toBe(true)
        const fork = error as ForkException
        expect(fork.expectedParentHash).toBe('something-non-null')
        expect(fork.previousBlocks).toEqual([{number: -1, hash: ZERO_HASH}])
    })

    it('throws ForkException at index 0 with expectedParentHash we tracked', async () => {
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(5, 'hash5', 'hash4alt')],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 5, 'hash4'))

        expect(yielded).toHaveLength(0)
        expect(isForkException(error)).toBe(true)
        const fork = error as ForkException
        expect(fork.expectedParentHash).toBe('hash4')
        expect(fork.previousBlocks).toEqual([{number: 4, hash: 'hash4alt'}])
    })

    it('yields the valid prefix before throwing on mid-batch mismatch', async () => {
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(3, 'hash3', 'hash2'), mkBlock(4, 'hash4', 'hash3'), mkBlock(5, 'hash5alt', 'hash4alt')],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 3, 'hash2'))

        expect(yielded).toHaveLength(1)
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['hash3', 'hash4'])

        expect(isForkException(error)).toBe(true)
        const fork = error as ForkException
        expect(fork.expectedParentHash).toBe('hash4')
        expect(fork.previousBlocks).toEqual([{number: 4, hash: 'hash4alt'}])
    })

    it('treats a null starting parentHash as "anything works"', async () => {
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(5, 'hash5', 'doesnotmatter')],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 5, undefined))

        expect(error).toBeUndefined()
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['hash5'])
    })
})
