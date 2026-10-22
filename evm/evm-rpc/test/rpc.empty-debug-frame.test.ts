import {describe, expect, it, vi} from 'vitest'
import {Rpc} from '../src/rpc'
import {toQty} from '../src/util'
import {getChainId, loadBlock, loadDebugFrames} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'

vi.mock('@subsquid/logger', () => ({
    createLogger: () => ({warn: vi.fn()}),
}))

// Scroll mainnet block 35441201 holds a single L1 message (type 0x7e): a self-transfer
// with empty input that failed (status 0x0, gasUsed 0x5208). l2geth's call tracer answers
// `{}` for it, the same on every provider asked. The response is captured unedited.
const SCROLL_BLOCK = 35441201
const SCROLL_L1_MESSAGE = '0xe398628cd2ea5c83d50b0e46e729caaf436f17a1adb3ddfb3a04837cc1f4dab5'

// Any Ethereum Sepolia block with full call frames, to put an empty frame where none is expected.
const SEPOLIA_BLOCK = 11319411

const TRACE_CONFIG = {
    tracer: 'callTracer',
    tracerConfig: {
        onlyTopCall: false,
        withLog: true,
    },
    timeout: undefined,
}

function mockClient(chain: string, blockNumber: number, frames: any[]): MockRpcClient {
    let client = new MockRpcClient()
    client.setFixture('eth_chainId', undefined, getChainId(chain))
    client.setFixture('eth_getBlockByNumber', [toQty(blockNumber), true], loadBlock(chain, blockNumber))
    client.setFixture('debug_traceBlockByNumber', [toQty(blockNumber), TRACE_CONFIG], frames)
    return client
}

// A block-level answer over the provider's size limit, which makes Rpc trace transaction by transaction.
function mockOversizedClient(chain: string, blockNumber: number, perTransaction: (txHash: string) => any) {
    let client = mockClient(chain, blockNumber, [])
    client.setFixture('debug_traceBlockByNumber', [toQty(blockNumber), TRACE_CONFIG], {
        error: {code: -32008, message: 'Response is too big'},
    })
    for (let tx of loadBlock(chain, blockNumber).transactions as any[]) {
        client.setFixture('debug_traceTransaction', [tx.hash, TRACE_CONFIG], perTransaction(tx.hash))
    }
    return client
}

function fetchBlock(client: MockRpcClient, blockNumber: number, transactions = true) {
    // Empty frames are judged in every call-frame-validation mode, so the default is enough.
    let rpc = new Rpc({client: client as any})
    return rpc.getBlockBatch([blockNumber], {
        transactions,
        traces: true,
        useDebugTraceBlockByNumber: true,
    })
}

describe('empty debug call frames', () => {
    it('accepts a Scroll L1 message without a call frame', async () => {
        let frames = loadDebugFrames('scroll', SCROLL_BLOCK)
        let blocks = await fetchBlock(mockClient('scroll', SCROLL_BLOCK, frames), SCROLL_BLOCK)

        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(blocks[0].debugFrames).toHaveLength(1)
        expect(blocks[0].debugFrames?.[0]).toBeUndefined()
    })

    it('accepts a Scroll L1 message when the caller requests transaction hashes', async () => {
        let frames = loadDebugFrames('scroll', SCROLL_BLOCK)
        let blocks = await fetchBlock(mockClient('scroll', SCROLL_BLOCK, frames), SCROLL_BLOCK, false)

        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(blocks[0].block.transactions).toEqual([SCROLL_L1_MESSAGE])
        expect(blocks[0].debugFrames).toHaveLength(1)
        expect(blocks[0].debugFrames?.[0]).toBeUndefined()
    })

    it('rejects an empty call frame labelled with another transaction', async () => {
        let otherTx = `0x${'11'.repeat(32)}`
        let frames = loadDebugFrames('scroll', SCROLL_BLOCK)
        frames[0].txHash = otherTx

        let blocks = await fetchBlock(mockClient('scroll', SCROLL_BLOCK, frames), SCROLL_BLOCK)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(
            `invalid debug call frames for transaction ${SCROLL_L1_MESSAGE}: response is labelled with transaction ${otherTx}`,
        )
    })

    it('rejects an empty call frame for a transaction that is not a Scroll L1 message', async () => {
        let block = loadBlock('scroll', SCROLL_BLOCK)
        let tx = block.transactions[0] as any
        tx.type = '0x2'
        let client = mockClient('scroll', SCROLL_BLOCK, loadDebugFrames('scroll', SCROLL_BLOCK))
        client.setFixture('eth_getBlockByNumber', [toQty(SCROLL_BLOCK), true], block)

        let blocks = await fetchBlock(client, SCROLL_BLOCK)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(`empty debug call frame for transaction ${SCROLL_L1_MESSAGE}`)
    })

    it('rejects an empty call frame on other chains', async () => {
        let block = loadBlock('ethereum-sepolia', SEPOLIA_BLOCK)
        let frames = loadDebugFrames('ethereum-sepolia', SEPOLIA_BLOCK)
        frames[0].result = {}

        let blocks = await fetchBlock(mockClient('ethereum-sepolia', SEPOLIA_BLOCK, frames), SEPOLIA_BLOCK)

        let txHash = (block.transactions[0] as any).hash
        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(`empty debug call frame for transaction ${txHash}`)
    })

    it('accepts a Scroll L1 message without a call frame when tracing per transaction', async () => {
        let blocks = await fetchBlock(
            mockOversizedClient('scroll', SCROLL_BLOCK, () => ({})),
            SCROLL_BLOCK,
        )

        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(blocks[0].debugFrames).toHaveLength(1)
        expect(blocks[0].debugFrames?.[0]).toBeUndefined()
    })

    it('rejects an empty call frame on other chains when tracing per transaction', async () => {
        let block = loadBlock('ethereum-sepolia', SEPOLIA_BLOCK)
        let frames = new Map(
            loadDebugFrames('ethereum-sepolia', SEPOLIA_BLOCK).map((f: any, i) => [
                (block.transactions[i] as any).hash,
                f.result,
            ]),
        )
        let txHash = (block.transactions[0] as any).hash
        let client = mockOversizedClient('ethereum-sepolia', SEPOLIA_BLOCK, (hash) =>
            hash === txHash ? {} : frames.get(hash),
        )

        let blocks = await fetchBlock(client, SEPOLIA_BLOCK)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(`empty debug call frame for transaction ${txHash}`)
    })
})
