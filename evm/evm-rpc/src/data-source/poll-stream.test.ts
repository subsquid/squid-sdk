import {describe, it, expect, vi} from 'vitest'
import {PollStream} from './poll-stream'
import type {Block} from '../types'
import type {Commitment, Rpc} from '../rpc'


function mkBlock(number: number, invalid?: string): Block {
    let block: Block = {
        number,
        hash: `0x${number.toString(16).padStart(64, '0')}`,
        block: {} as Block['block'],
    }
    if (invalid) {
        block._isInvalid = true
        block._errorMessage = invalid
    }
    return block
}


// A chain at head 104 whose block 102 is invalid for the first `invalidPolls` fetches.
function mkRpc(invalidPolls: number) {
    let polls = 0
    return {
        endpoint: 'http://rpc.test',
        getLatestBlockhash: vi.fn(async () => ({number: 104, hash: '0x'})),
        getBlockBatch: vi.fn(async (numbers: number[]) => {
            let blocks = numbers.map(n => {
                if (n == 102 && polls < invalidPolls) return mkBlock(n, 'block access list does not match blockAccessListHash')
                return mkBlock(n)
            })
            if (numbers.includes(102)) polls += 1
            return blocks
        })
    } as unknown as Rpc
}


function mkStream(rpc: Rpc, commitment: Commitment) {
    return new PollStream({rpc, commitment, from: 100, strideSize: 10})
}


describe('PollStream', () => {
    it('stops a batch before an invalid block and polls it again', async () => {
        const stream = mkStream(mkRpc(1), 'finalized')

        expect((await stream.next()).map(b => b.number)).toEqual([100, 101])
        expect(stream.position()).toEqual(102)
        expect((await stream.next()).map(b => b.number)).toEqual([102, 103, 104])
    })

    it('fails the finalized stream when a block stays invalid', async () => {
        const stream = mkStream(mkRpc(Number.POSITIVE_INFINITY), 'finalized')
        await stream.next()

        let err: any
        for (let i = 0; i < 10 && err == null; i++) {
            await stream.next().catch(e => {
                err = e
            })
        }

        expect(err?.message).toMatch(/blockAccessListHash/)
        expect(err.failedBlocks).toEqual([102])
        expect(err.rpcUrl).toEqual('http://rpc.test')
    })

    it('recovers when a finalized block turns valid within the retry budget', async () => {
        const stream = mkStream(mkRpc(5), 'finalized')

        for (let i = 0; i < 5; i++) {
            await stream.next()
        }
        expect(stream.position()).toEqual(102)
        expect((await stream.next()).map(b => b.number)).toEqual([102, 103, 104])
    })

    it('keeps polling an invalid block at the head of the latest stream', async () => {
        const stream = mkStream(mkRpc(20), 'latest')

        for (let i = 0; i < 20; i++) {
            await stream.next()
        }
        expect(stream.position()).toEqual(102)
        expect((await stream.next()).map(b => b.number)).toEqual([102, 103, 104])
    })
})
