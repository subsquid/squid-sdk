import {afterEach, describe, expect, it} from 'vitest'
import {MockEvmRpc} from './mock-evm-rpc'

let rpc: MockEvmRpc | undefined

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

describe('MockEvmRpc', () => {
    it('builds a linked chain and serves it by number, tag and hash', async () => {
        rpc = new MockEvmRpc({finalizedLag: 2})
        rpc.mine(5)
        let url = await rpc.listen()

        expect((await call(url, 'eth_blockNumber')).result).toBe('0x5')
        let b3 = (await call(url, 'eth_getBlockByNumber', ['0x3', false])).result
        expect(b3.parentHash).toBe(rpc.hashAt(2))
        expect((await call(url, 'eth_getBlockByNumber', ['finalized', false])).result.number).toBe('0x3')
        expect((await call(url, 'eth_getBlockByHash', [b3.hash, false])).result.number).toBe('0x3')
    })

    it('reorgs onto a new branch, possibly shorter, keeping old blocks retrievable by hash', () => {
        rpc = new MockEvmRpc()
        rpc.mine(10)
        let old9 = rpc.hashAt(9)
        let base = rpc.reorg({depth: 4, length: 2})

        expect(base.number).toBe(6)
        expect(rpc.head.number).toBe(8)
        expect(rpc.chain[7].parentHash).toBe(rpc.hashAt(6))
        expect(rpc.hashAt(7)).not.toBe(old9)
        for (let i = 1; i < rpc.chain.length; i++) {
            expect(rpc.chain[i].parentHash).toBe(rpc.chain[i - 1].hash)
        }
    })

    it('answers batch requests and records unsupported methods', async () => {
        rpc = new MockEvmRpc()
        rpc.mine(2)
        let url = await rpc.listen()
        let res = await fetch(url, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify([
                {jsonrpc: '2.0', id: 1, method: 'eth_chainId'},
                {jsonrpc: '2.0', id: 2, method: 'eth_getLogs', params: [{}]},
            ]),
        }).then((r) => r.json())

        expect(res[0].result).toBe('0x7a69')
        expect(res[1].error.code).toBe(-32601)
        expect([...rpc.unsupportedMethods]).toEqual(['eth_getLogs'])
    })
})
