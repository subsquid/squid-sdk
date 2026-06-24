import { describe, it, expect } from 'vitest'
import { loadBlock } from './helpers/fixture-loader'
import { MockRpcClient } from './helpers/mock-rpc-client'
import { Rpc } from '../src/rpc'
import { toQty, getTxHash } from '../src/util'

// Regression for the base-sepolia "No Dumper Data" stall: a very large block's
// whole-block prestateTracer state-diff response exceeds the provider's response
// size cap (geth/erigon/alchemy/dwellir all return JSON-RPC error -32008
// "Response is too big" / "Exceeded max limit of 167772160"). Splitting/retrying
// the block batch can't help — a single block can't be split — so the dumper used
// to stall/crash-loop forever on that block. The fix falls back to per-transaction
// debug_traceTransaction, where each response is small.

const BLOCK = 18000000

// Must match the traceConfig that Rpc.addDebugStateDiffs builds verbatim, since the
// mock keys fixtures by JSON.stringify(params).
const TRACE_CONFIG = {
    tracer: 'prestateTracer',
    tracerConfig: { onlyTopCall: false, diffMode: true },
    timeout: '20s'
}

const REQUEST = {
    transactions: true,
    stateDiffs: true,
    useDebugApiForStateDiffs: true,
    useDebugTraceBlockByNumber: true,
    debugTraceTimeout: '20s'
}

function diffFor(i: number) {
    // a small, valid per-tx state diff; storage key varies per tx so we can assert wiring
    let slot = '0x' + i.toString(16).padStart(64, '0')
    return {
        pre: { '0x4200000000000000000000000000000000000015': { storage: { [slot]: '0x00' } } },
        post: { '0x4200000000000000000000000000000000000015': { storage: { [slot]: '0x01' } } }
    }
}

describe('debug state diff response-too-big handling', () => {
    it('falls back to per-transaction tracing when the whole-block state diff exceeds the size cap', async () => {
        const block = loadBlock('ethereum', BLOCK)
        const txs = block.transactions as any[]
        expect(txs.length).toBeGreaterThan(1)

        const mockClient = new MockRpcClient()
        mockClient.setFixture('eth_chainId', undefined, '0x1')
        mockClient.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], block)

        // whole-block call rejects with the provider's size-cap error
        mockClient.setErrorFixture('debug_traceBlockByNumber', [block.number, TRACE_CONFIG], {
            code: -32008,
            message: 'Response is too big',
            data: 'Exceeded max limit of 167772160'
        })
        // per-transaction calls succeed with small responses
        txs.forEach((tx, i) => {
            mockClient.setFixture('debug_traceTransaction', [getTxHash(tx), TRACE_CONFIG], diffFor(i))
        })

        const rpc = new Rpc({ client: mockClient as any })

        const blocks = await rpc.getBlockBatch([BLOCK], REQUEST)
        expect(blocks).toHaveLength(1)

        const diffs = blocks[0].debugStateDiffs!
        expect(diffs).toBeTruthy()
        expect(diffs.length).toEqual(txs.length)
        // every per-tx diff is reattached to its transaction in order
        for (let i = 0; i < txs.length; i++) {
            expect(diffs[i]!.txHash).toEqual(getTxHash(txs[i]))
            expect(diffs[i]!.result).toEqual(diffFor(i))
        }
        expect(blocks[0]._isInvalid).toBeFalsy()
    })

    it('uses the whole-block response directly when it fits (no per-tx fallback)', async () => {
        const block = loadBlock('ethereum', BLOCK)
        const txs = block.transactions as any[]

        const mockClient = new MockRpcClient()
        mockClient.setFixture('eth_chainId', undefined, '0x1')
        mockClient.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], block)
        mockClient.setFixture(
            'debug_traceBlockByNumber',
            [block.number, TRACE_CONFIG],
            txs.map((tx, i) => ({ result: diffFor(i), txHash: getTxHash(tx) }))
        )
        // deliberately NO debug_traceTransaction fixtures — if the fallback fired,
        // the missing-fixture error would surface.

        const rpc = new Rpc({ client: mockClient as any })

        const blocks = await rpc.getBlockBatch([BLOCK], REQUEST)
        expect(blocks).toHaveLength(1)
        expect(blocks[0].debugStateDiffs!.length).toEqual(txs.length)
        expect(blocks[0]._isInvalid).toBeFalsy()
    })
})
