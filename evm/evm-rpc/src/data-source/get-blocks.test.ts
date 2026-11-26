import {describe, it, expect, vi} from 'vitest'
import {getBlocks} from './get-blocks'
import type {Block, DataRequest} from '../types'
import type {Rpc} from '../rpc'

vi.mock('@subsquid/util-internal', async (importOriginal) => ({
    ...await importOriginal<typeof import('@subsquid/util-internal')>(),
    wait: vi.fn().mockResolvedValue(undefined)
}))

function mkBlock(number: number): Block {
    return {
        number,
        hash: `0x${number.toString(16).padStart(64, '0')}`,
        block: {
            hash: `0x${number.toString(16).padStart(64, '0')}`,
            parentHash: `0x${(number - 1).toString(16).padStart(64, '0')}`,
        } as Block['block'],
    }
}

function mkRpc(getBlockBatch: Rpc['getBlockBatch']) {
    return {getBlockBatch: vi.fn(getBlockBatch)} as unknown as Rpc
}

const REQ: DataRequest = {}

describe('getBlocks', () => {
    it('returns all blocks when the full range is fetched successfully', async () => {
        const blocks = [mkBlock(100), mkBlock(101), mkBlock(102), mkBlock(103), mkBlock(104)]
        const rpc = mkRpc(async () => blocks)

        const result = await getBlocks(rpc, REQ, {from: 100, to: 104})

        expect(result).toHaveLength(5)
        expect(result.map(b => b.number)).toEqual([100, 101, 102, 103, 104])
    })

    it('throws with missing block numbers when RPC returns fewer blocks than requested', async () => {
        let callCount = 0
        const rpc = mkRpc(async () => {
            callCount++
            if (callCount === 1) {
                return [mkBlock(100), mkBlock(101), mkBlock(102)]
            }
            return []
        })

        await expect(
            getBlocks(rpc, REQ, {from: 100, to: 104})
        ).rejects.toThrow(/failed to load blocks/)
    })

    it('retries and succeeds when missing blocks become available', async () => {
        let callCount = 0
        const rpc = mkRpc(async (numbers: number[]) => {
            callCount++
            if (callCount === 1) {
                return [mkBlock(100), mkBlock(101), mkBlock(102)]
            }
            return numbers.map(n => mkBlock(n))
        })

        const result = await getBlocks(rpc, REQ, {from: 100, to: 104})
        expect(result).toHaveLength(5)
        expect(result.map(b => b.number)).toEqual([100, 101, 102, 103, 104])
    })

    it('rides out an intermittent provider that stays flaky beyond the old 5-retry budget', async () => {
        // Provider keeps dropping blocks 103/104 for 7 consecutive rounds (more
        // than the previous 5-retry window) before finally serving them. With the
        // enlarged retry budget this recovers instead of crash-looping the dumper.
        let callCount = 0
        const rpc = mkRpc(async (numbers: number[]) => {
            callCount++
            if (callCount === 1) {
                return [mkBlock(100), mkBlock(101), mkBlock(102)]
            }
            if (callCount <= 7) {
                return []
            }
            return numbers.map(n => mkBlock(n))
        })

        const result = await getBlocks(rpc, REQ, {from: 100, to: 104})
        expect(result).toHaveLength(5)
        expect(result.map(b => b.number)).toEqual([100, 101, 102, 103, 104])
    })
})
