import {type ForkException, isForkException} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'
import type {Rpc} from '../rpc'
import type {Block} from '../types'
import {EvmRpcDataSource} from './rpc-data-source'
import type {IngestBatch} from './ingest'

// ensureContinuity is a pure async-generator method over IngestBatch —
// it never calls into this.rpc at runtime. The constructor, though, reads
// rpc.getConcurrency() to size the stride concurrency, so the stub needs
// that one method.
const stubRpc = {getConcurrency: () => 1} as unknown as Rpc

function mkSource(): EvmRpcDataSource {
    return new EvmRpcDataSource({rpc: stubRpc, req: {}})
}

// Minimal block stub — ensureContinuity reads only block.block.hash and
// block.block.parentHash, plus top-level number. Everything else stays
// `undefined`/absent.
function mkBlock(number: number, hash: string, parentHash: string): Block {
    return {
        number,
        hash,
        block: {hash, parentHash} as Block['block'],
    }
}

// Wrap a list of IngestBatches as an async generator, as ensureContinuity
// consumes upstream batches one at a time.
async function* yieldBatches(...batches: IngestBatch[]): AsyncIterable<IngestBatch> {
    for (const b of batches) yield b
}

// Collect everything ensureContinuity yields, and capture any throw as
// a separate field. Makes assertion shapes explicit.
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

describe('EvmRpcDataSource.ensureContinuity', () => {
    it('passes through a continuous chain untouched', async () => {
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(1, '0x1', '0x0'), mkBlock(2, '0x2', '0x1'), mkBlock(3, '0x3', '0x2')],
            finalized: undefined,
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 1, '0x0'))

        expect(error).toBeUndefined()
        expect(yielded).toHaveLength(1)
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['0x1', '0x2', '0x3'])
    })

    it('treats a null starting parentHash as "anything works"', async () => {
        // When parentHash is undefined (e.g. first-ever stream), ensureContinuity
        // adopts whatever the first block says. No mismatch possible at index 0.
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(5, '0x5', '0xdoesnotmatter'), mkBlock(6, '0x6', '0x5')],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 5, undefined))

        expect(error).toBeUndefined()
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['0x5', '0x6'])
    })

    it('throws ForkException at index 0 with the expected parent hash we tracked', async () => {
        // The caller passed parentHash='0x4' — what we expect the incoming
        // block's parentHash to be. The block actually carries '0x4alt',
        // so ensureContinuity must throw with expectedParentHash='0x4'
        // (what we expected) and previousBlocks[0].hash='0x4alt' (what came
        // in). No blocks yield before the throw because the bad block is at
        // index 0.
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(5, '0x5', '0x4alt')],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 5, '0x4'))

        expect(yielded).toHaveLength(0) // no prefix yielded — mismatch at index 0
        expect(isForkException(error)).toBe(true)
        const fork = error as ForkException
        expect(fork.expectedParentHash).toBe('0x4')
        expect(fork.previousBlocks).toEqual([{number: 4, hash: '0x4alt'}])
    })

    it('yields the valid prefix before throwing on a mid-batch mismatch', async () => {
        // Batch = [valid 3, valid 4, fork 5-alt]. Blocks 3 and 4 must be
        // yielded to the consumer before the ForkException surfaces — a
        // deliberate design choice in ensureContinuity to simplify downstream
        // code that doesn't want to re-fetch the continuous prefix.
        const src = mkSource()
        const batch: IngestBatch = {
            blocks: [mkBlock(3, '0x3', '0x2'), mkBlock(4, '0x4', '0x3'), mkBlock(5, '0x5alt', '0x4alt')],
        }

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(batch), 3, '0x2'))

        expect(yielded).toHaveLength(1)
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['0x3', '0x4'])

        expect(isForkException(error)).toBe(true)
        const fork = error as ForkException
        // After valid blocks 3 and 4, tracked parentHash advanced to '0x4'.
        // Block 5 carried parentHash='0x4alt', so the expected value is '0x4'.
        expect(fork.expectedParentHash).toBe('0x4')
        expect(fork.previousBlocks).toEqual([{number: 4, hash: '0x4alt'}])
    })

    it('advances parentHash across multiple batches and catches a fork at the seam', async () => {
        // Simulates the way ingest() delivers blocks — several small batches.
        // The first batch ends cleanly; the second opens with a block whose
        // parent doesn't match the last block of the previous batch.
        const src = mkSource()
        const first: IngestBatch = {blocks: [mkBlock(1, '0x1', '0x0'), mkBlock(2, '0x2', '0x1')]}
        const second: IngestBatch = {blocks: [mkBlock(3, '0x3alt', '0x2alt')]}

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(first, second), 1, '0x0'))

        expect(yielded).toHaveLength(1)
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['0x1', '0x2'])

        expect(isForkException(error)).toBe(true)
        const fork = error as ForkException
        expect(fork.expectedParentHash).toBe('0x2') // last good hash from first batch
        expect(fork.previousBlocks).toEqual([{number: 2, hash: '0x2alt'}])
    })

    it('skips yielding an empty batch if upstream yields zero blocks', async () => {
        const src = mkSource()
        const empty: IngestBatch = {blocks: []}
        const follow: IngestBatch = {blocks: [mkBlock(1, '0x1', '0x0')]}

        const {yielded, error} = await drain(src.ensureContinuity(yieldBatches(empty, follow), 1, '0x0'))

        expect(error).toBeUndefined()
        // Upstream's empty batch is not re-yielded (the `batch.blocks.length > 0`
        // guard in ensureContinuity); only the follow-up batch appears.
        expect(yielded).toHaveLength(1)
        expect(yielded[0].blocks.map((b) => b.hash)).toEqual(['0x1'])
    })
})
