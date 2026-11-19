import {describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import {toQty} from '../src/util'
import {calldataFloorGas} from '../src/verification'
import {getChainId, loadBlock, loadReceipts} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'


// TAC block 2203987 holds one transaction that the chain included although its gas limit
// (22700) is below its EIP-7623 calldata floor (22760). It ran no code: the receipt reports
// status 0, all the gas used and no logs. Nodes cannot replay it, and both the block trace
// and the transaction trace fail on the server.
const CHAIN = 'tac'
const BLOCK = 2203987
const TX_HASH = '0x10f2bd4ec52aab60a7b63374b58dd9bedbcd35e8354378b9ca91432f9ddc2f62'

// TAC refuses tracerConfig, so the Rpc leaves it out
const TRACE_CONFIG = {tracer: 'callTracer', timeout: undefined}

const NODE_PANIC = {
    error: {code: -32000, message: 'rpc error: code = Internal desc = runtime error: index out of range [0] with length 0'}
}


function mockClient(opts: {receipt?: any; txTrace?: any} = {}): MockRpcClient {
    let client = new MockRpcClient()
    let block = loadBlock(CHAIN, BLOCK)
    client.setFixture('eth_chainId', undefined, getChainId(CHAIN))
    client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], block)
    client.setFixture('debug_traceBlockByHash', [block.hash, TRACE_CONFIG], NODE_PANIC)
    client.setFixture('debug_traceTransaction', [TX_HASH, TRACE_CONFIG], opts.txTrace ?? NODE_PANIC)
    client.setFixture('eth_getTransactionReceipt', [TX_HASH], opts.receipt ?? loadReceipts(CHAIN, BLOCK)[0])
    return client
}


function getBlock(client: MockRpcClient, stubCalldataFloorFailures: boolean) {
    let rpc = new Rpc({client: client as any})
    return rpc.getBlockBatch([BLOCK], {transactions: true, traces: true, stubCalldataFloorFailures})
}


describe('transactions below the EIP-7623 calldata floor', () => {
    it('computes the calldata floor', () => {
        let tx = loadBlock(CHAIN, BLOCK).transactions[0] as any
        expect(calldataFloorGas(tx.input)).toBe(22760n)
        expect(calldataFloorGas('0x')).toBe(21000n)
        expect(calldataFloorGas(undefined)).toBe(21000n)
    })

    it('stores a failed root frame when the node cannot trace the transaction', async () => {
        let blocks = await getBlock(mockClient(), true)
        expect(blocks).toHaveLength(1)
        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(blocks[0].debugFrames).toEqual([
            {
                txHash: TX_HASH,
                result: {
                    type: 'CALL',
                    from: '0x435046800fb9149ee65159721a92cb7d50a7534b',
                    to: '0x3ef3d8ba38ebe18db133cec108f4d14ce00dd9ae',
                    input: '0xd9c98087a674388a07d63ae83a317d71565a28b1816109a41ffb9114648663d0f7c137410000000000000000000000000000000000000000000000000000000000000000',
                    value: '0x0',
                    gas: '0x58ac',
                    gasUsed: '0x58ac',
                    error: 'insufficient gas for floor data gas cost'
                }
            }
        ])
    })

    it('keeps the trace the node gives per transaction', async () => {
        let frame = {
            type: 'CALL',
            from: '0x435046800fb9149ee65159721a92cb7d50a7534b',
            to: '0x3ef3d8ba38ebe18db133cec108f4d14ce00dd9ae',
            input: '0x',
            gas: '0x58ac',
            gasUsed: '0x58ac',
            error: 'out of gas'
        }
        let blocks = await getBlock(mockClient({txTrace: frame}), true)
        expect(blocks[0].debugFrames).toEqual([{txHash: TX_HASH, result: frame}])
    })

    it('fails without the flag', async () => {
        // The mock client turns an error thrown inside a batch into a result, so the failure surfaces
        // later than with the real client; what matters is that no block comes back
        await expect(getBlock(mockClient(), false)).rejects.toThrow()
    })

    it('fails on the trace error when the receipt does not confirm the outcome', async () => {
        let receipt = {...loadReceipts(CHAIN, BLOCK)[0], status: '0x1'}
        await expect(getBlock(mockClient({receipt}), true)).rejects.toThrow(/index out of range/)

        receipt = {...loadReceipts(CHAIN, BLOCK)[0], gasUsed: '0x5800'}
        await expect(getBlock(mockClient({receipt}), true)).rejects.toThrow(/index out of range/)
    })
})
