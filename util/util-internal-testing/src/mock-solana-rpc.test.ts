import {afterEach, describe, expect, it} from 'vitest'
import {MockSolanaRpc} from './mock-solana-rpc'

let rpc: MockSolanaRpc | undefined

afterEach(async () => {
    await rpc?.close()
    rpc = undefined
})

async function call(url: string, method: string, params: unknown[] = []): Promise<any> {
    let res = await fetch(url, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
    })
    return res.json()
}

describe('MockSolanaRpc', () => {
    it('serves a linked chain with skipped slots, base58 hashes and commitments', async () => {
        rpc = new MockSolanaRpc({finalizedLag: 2})
        rpc.mine(3)
        rpc.mine(1, {skip: 2}) // slot 6, slots 4 and 5 skipped
        let url = await rpc.listen()

        expect(rpc.head.slot).toBe(6)
        expect(rpc.head.parentSlot).toBe(3)
        expect(rpc.head.blockhash).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
        expect((await call(url, 'getBlocks', [0, 10, {commitment: 'confirmed'}])).result).toEqual([0, 1, 2, 3, 6])
        expect((await call(url, 'getLatestBlockhash', [{commitment: 'finalized'}])).result.context.slot).toBe(2)

        let skipped = await call(url, 'getBlock', [4, {commitment: 'confirmed'}])
        expect(skipped.error.message).toMatch(/was skipped/)
        let future = await call(url, 'getBlock', [9, {commitment: 'confirmed'}])
        expect(future.error.message).toMatch(/^Block not available for slot/)
        let header = (
            await call(url, 'getBlock', [6, {commitment: 'confirmed', transactionDetails: 'none', rewards: false}])
        ).result
        expect(header).toMatchObject({blockhash: rpc.head.blockhash, parentSlot: 3, previousBlockhash: rpc.hashAt(3)})
        expect(header).not.toHaveProperty('transactions')
    })

    it('reorgs onto a new branch that reuses the replaced slots', () => {
        rpc = new MockSolanaRpc()
        rpc.mine(10)
        let old9 = rpc.hashAt(9)
        let base = rpc.reorg({depth: 4, length: 2})

        expect(base.slot).toBe(6)
        expect(rpc.head.slot).toBe(8)
        expect(rpc.hashAt(9)).toBeUndefined()
        expect(rpc.chain[7].previousBlockhash).toBe(rpc.hashAt(6))
        rpc.mineTo(9)
        expect(rpc.hashAt(9)).not.toBe(old9)
    })
})
