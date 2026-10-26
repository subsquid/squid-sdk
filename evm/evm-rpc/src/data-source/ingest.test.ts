import {wait} from '@subsquid/util-internal'
import {describe, expect, it} from 'vitest'
import type {Commitment, Rpc} from '../rpc'
import type {Block} from '../types'
import {ingest} from './ingest'

const HEAD = 100

// Once the stream has caught up, PollStream.next() asks the chain head on every
// turn of the loop and returns nothing, so head calls are a direct count of how
// often that loop spun.
function mkRpc(): {rpc: Rpc; headCalls: () => number} {
    let calls = 0
    const rpc = {
        getConcurrency: () => 1,
        getLatestBlockhash: async (commitment: Commitment) => {
            if (commitment === 'latest') calls += 1
            return {number: HEAD, hash: '0xhead'}
        },
        getBlockBatch: async (numbers: number[]): Promise<Block[]> =>
            numbers.map(number => ({
                number,
                hash: `0x${number}`,
                block: {hash: `0x${number}`, parentHash: `0x${number - 1}`} as Block['block'],
            })),
    } as unknown as Rpc

    return {rpc, headCalls: () => calls}
}

// Drain the one batch that sits at the head, then let the caught-up loop spin
// untouched for `idleMs` and report how many head polls it made in that window.
async function countIdleHeadPolls(headPollInterval: number, idleMs: number): Promise<number> {
    const {rpc, headCalls} = mkRpc()

    const stream = ingest({
        rpc,
        commitment: 'latest',
        req: {},
        range: {from: HEAD},
        strideSize: 5,
        strideConcurrency: 1,
        headPollInterval,
    })

    const it = stream[Symbol.asyncIterator]()
    await it.next()

    const before = headCalls()
    await wait(idleMs)
    const polls = headCalls() - before

    await it.return?.()
    return polls
}

describe('ingest', () => {
    it('spaces head polls by headPollInterval once caught up', async () => {
        const polls = await countIdleHeadPolls(1000, 300)
        expect(polls).toBeLessThanOrEqual(1)
    })

    it('polls far more often with a short interval', async () => {
        const polls = await countIdleHeadPolls(20, 300)
        expect(polls).toBeGreaterThan(4)
    })
})
