import {describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import {toQty} from '../src/util'
import {getChainId, loadBlock} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'


// Base mainnet block 49835559 carries 6485 transactions, so a whole-block
// `debug_traceBlockByNumber` response is far beyond any provider's response
// size limit (e.g. Alchemy/Tatum -32008 "Response is too big"), while the
// same block is still traceable transaction-by-transaction. On that error the
// Rpc falls back to `debug_traceTransaction` for every transaction of the
// block and reassembles the result in the whole-block shape.
//
// The block fixture carries full transaction objects; notably, several public
// endpoints refuse to serve this block with full transactions at all
// ("backend response too large"), so it was captured from an endpoint that
// still returns it whole.
const CHAIN = 'base-mainnet'
const BLOCK = 49835559
const TX_COUNT = loadBlock(CHAIN, BLOCK).transactions.length
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const TRACE_CONFIG = {
    tracer: 'callTracer',
    tracerConfig: {
        onlyTopCall: false,
        withLog: true
    },
    timeout: undefined
}


function mockClient(): MockRpcClient {
    let client = new MockRpcClient()
    let block = loadBlock(CHAIN, BLOCK)
    // Real debug frames for a 6485-transaction block would make a heavy
    // fixture, which is not really necessary to keep in the repo: this test
    // exercises the fallback wiring, not the frame content, so every
    // per-transaction response is mocked with the same minimal valid frame.
    let frame = {
        type: 'CALL',
        from: ZERO_ADDRESS,
        to: ZERO_ADDRESS,
        input: '0x',
        gas: '0x0',
        gasUsed: '0x0'
    }

    client.setFixture('eth_chainId', undefined, getChainId(CHAIN))
    client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), false], block)
    client.setFixture(
        'debug_traceBlockByHash',
        [block.hash, TRACE_CONFIG],
        {error: {code: -32008, message: 'Response is too big'}}
    )

    for (let tx of block.transactions) {
        let txHash = typeof tx === 'string' ? tx : tx.hash
        client.setFixture(
            'debug_traceTransaction',
            [txHash, TRACE_CONFIG],
            frame
        )
    }

    return client
}


describe('oversized whole-block trace response', () => {
    it('falls back to per-transaction tracing for an oversized block response', async () => {
        let rpc = new Rpc({
            client: mockClient() as any
        })

        let blocks = await rpc.getBlockBatch([BLOCK], {
            traces: true
        })

        expect(blocks.length).toEqual(1)
        expect(blocks[0].debugFrames).toHaveLength(TX_COUNT)
    })
})
