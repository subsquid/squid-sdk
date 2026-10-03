import {describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import {DebugStateDiff, UNDERFLOWED_NONCE} from '../src/rpc-data'
import {toQty} from '../src/util'
import {getChainId, loadBlock, loadDebugStateDiffs} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'

// Prom mainnet block 9821755 holds one transaction: a contract deployment by
// 0x6516…a137, the first transaction of that account. cdk-erigon/v2.0.12-rc1
// returns the account's nonce before it as 18446744073709551615 (2^64 - 1) and
// after it as 1, while trace_replayTransaction on the same node reports 0x0 -> 0x1.
const CHAIN = 'prom'
const BLOCK = 9821755
const SENDER = '0x6516418519f32ef281a621d37309bc823924a137'
const SEQUENCER = '0x62932c83c4a226679c1af67ed46e1871cd0a6b4a'

const TRACE_CONFIG = {
    tracer: 'prestateTracer',
    tracerConfig: {
        onlyTopCall: false,
        diffMode: true,
    },
    timeout: undefined,
}

function mockClient(wholeBlockResponse?: any): MockRpcClient {
    let client = new MockRpcClient()
    let block = loadBlock(CHAIN, BLOCK)
    let diffs = loadDebugStateDiffs(CHAIN, BLOCK)

    client.setFixture('eth_chainId', undefined, getChainId(CHAIN))
    client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], block)
    client.setFixture('debug_traceBlockByHash', [block.hash, TRACE_CONFIG], wholeBlockResponse ?? diffs)

    for (let i = 0; i < block.transactions.length; i++) {
        let tx = block.transactions[i]
        let txHash = typeof tx === 'string' ? tx : tx.hash
        client.setFixture('debug_traceTransaction', [txHash, TRACE_CONFIG], diffs[i].result)
    }

    return client
}

function fetchStateDiffs(client: MockRpcClient) {
    let rpc = new Rpc({
        client: client as any,
    })
    return rpc.getBlockBatch([BLOCK], {
        transactions: true,
        stateDiffs: true,
        useDebugApiForStateDiffs: true,
    })
}

describe('underflowed prestate nonce', () => {
    it('is stored as 0', async () => {
        let blocks = await fetchStateDiffs(mockClient())

        expect(blocks).toHaveLength(1)
        expect(blocks[0]._isInvalid).toBeFalsy()

        let diff = blocks[0].debugStateDiffs![0]!.result
        expect(diff.pre[SENDER].nonce).toBe(0)
        expect(diff.post[SENDER].nonce).toBe(1)
        expect(diff.pre[SEQUENCER].nonce).toBe(2)
    })

    it('is stored as 0 when the block is traced per transaction', async () => {
        let client = mockClient({error: {code: -32008, message: 'Response is too big'}})
        let blocks = await fetchStateDiffs(client)

        expect(blocks).toHaveLength(1)
        expect(blocks[0]._isInvalid).toBeFalsy()

        let diffs = blocks[0].debugStateDiffs!
        expect(diffs).toHaveLength(1)
        expect(diffs[0]!.txHash).toEqual('0x93831d9398fce45b4a2c047c08670bf1a18c25578eb68bd4c6d0d0cacd612e0d')
        expect(diffs[0]!.result.pre[SENDER].nonce).toBe(0)
        expect(diffs[0]!.result.post[SENDER].nonce).toBe(1)
    })
})

describe('DebugStateDiff nonce validation', () => {
    function stateDiff(pre: unknown, post: unknown) {
        return {
            pre: {[SENDER]: {nonce: pre}},
            post: {[SENDER]: {nonce: post}},
        }
    }

    it('accepts 2^64 - 1 before the transaction, as JSON.parse() returns it', () => {
        expect(JSON.parse('18446744073709551615')).toBe(UNDERFLOWED_NONCE)
        expect(DebugStateDiff.validate(stateDiff(UNDERFLOWED_NONCE, 1))).toBeUndefined()
    })

    it.each([
        ['2^53', 2 ** 53],
        ['2^63', 2 ** 63],
        ['the next number after 2^64', 2 ** 64 + 4096],
        ['a negative number', -1],
        ['a fraction', 1.5],
        ['a hex string', '0x1'],
    ])('rejects %s before the transaction', (_, nonce) => {
        expect(DebugStateDiff.validate(stateDiff(nonce, 1))).toBeDefined()
    })

    it('rejects 2^64 - 1 after the transaction', () => {
        expect(DebugStateDiff.validate(stateDiff(0, UNDERFLOWED_NONCE))).toBeDefined()
    })
})
