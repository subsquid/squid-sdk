import {describe, expect, it, vi} from 'vitest'
import type {Rpc} from '../rpc'
import type {Block} from '../types'
import {finalize} from './finalizer'
import type {IngestBatch} from './ingest'

function mkBlock(number: number): Block {
    return {
        number,
        hash: `0x${number}`,
        block: {hash: `0x${number}`, parentHash: `0x${number - 1}`} as Block['block'],
    }
}

describe('finalize', () => {
    it('does not take finality from a block that failed hash verification', async () => {
        const rpc = {
            getFinalizedBlockBatch: vi.fn(async (numbers: number[]) => numbers.map(n => ({
                ...mkBlock(n),
                _isInvalid: true,
                _errorMessage: 'failed to verify block hash'
            })))
        } as unknown as Rpc

        async function* stream(): AsyncIterable<IngestBatch> {
            yield {blocks: [mkBlock(100)]}
            await vi.waitFor(() => expect(rpc.getFinalizedBlockBatch).toHaveBeenCalled())
            yield {blocks: [mkBlock(101)]}
        }

        const batches = []
        for await (let batch of finalize(rpc, stream())) {
            batches.push(batch)
        }

        expect(batches).toHaveLength(2)
        expect(batches[1].finalizedHead).toBeUndefined()
    })
})
