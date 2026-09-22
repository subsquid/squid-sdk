import {RpcClient, RpcError} from '@subsquid/rpc-client'
import {RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import {BlockConsistencyError} from '@subsquid/util-internal-ingest-tools'
import assert from 'assert'
import { describe, it } from 'vitest'
import {Rpc} from './rpc'
import {toQty} from './util'


interface MockResponse {
    result?: unknown
    error?: RpcErrorInfo
}


/**
 * Creates a minimal RpcClient mock that reproduces the validateResult / validateError
 * dispatch logic of the real client without any transport.
 */
function mockClient(responses: Record<string, MockResponse | ((params: any[]) => MockResponse)>): RpcClient {
    function dispatch(method: string, params: any[] | undefined, options: any): unknown {
        let entry = responses[method]
        let resp = typeof entry == 'function' ? entry(params ?? []) : entry
        if (resp == null) return null
        if (resp.error) {
            if (options?.validateError) {
                return options.validateError(resp.error, {id: 1, jsonrpc: '2.0', method})
            }
            throw new RpcError(resp.error)
        }
        if (options?.validateResult) {
            return options.validateResult(resp.result, {id: 1, jsonrpc: '2.0', method})
        }
        return resp.result
    }

    return {
        call(method: string, params?: any[], options?: any) {
            try {
                return Promise.resolve(dispatch(method, params, options))
            } catch (err) {
                return Promise.reject(err)
            }
        },
        batchCall(batch: any[], options?: any) {
            try {
                let results = batch.map(({method, params}) => dispatch(method, params, options))
                return Promise.resolve(results)
            } catch (err) {
                return Promise.reject(err)
            }
        },
        getConcurrency() { return 10 }
    } as unknown as RpcClient
}


// ---------------------------------------------------------------------------
// getBlockByHash
// ---------------------------------------------------------------------------

describe('getBlockByHash', () => {
    it('returns null for "not found" error', async () => {
        let rpc = new Rpc(mockClient({
            eth_getBlockByHash: {error: {code: -32000, message: 'block not found'}}
        }))
        assert.strictEqual(await rpc.getBlockByHash('0xabc', false), null)
    })

    it('returns null for "not currently canonical" error', async () => {
        let rpc = new Rpc(mockClient({
            eth_getBlockByHash: {error: {code: -32603, message: 'hash 0xabc is not currently canonical'}}
        }))
        assert.strictEqual(await rpc.getBlockByHash('0xabc', false), null)
    })

    it('throws for other RPC errors', async () => {
        let rpc = new Rpc(mockClient({
            eth_getBlockByHash: {error: {code: -32000, message: 'internal server error'}}
        }))
        await assert.rejects(rpc.getBlockByHash('0xabc', false), RpcError)
    })
})


// ---------------------------------------------------------------------------
// getColdBlock — verifies that a null from getBlockByHash becomes BlockConsistencyError
// ---------------------------------------------------------------------------

describe('getColdBlock', () => {
    it('throws BlockConsistencyError when block is not currently canonical', async () => {
        let rpc = new Rpc(mockClient({
            eth_getBlockByHash: {error: {code: -32603, message: 'hash 0xabc is not currently canonical'}}
        }))
        await assert.rejects(rpc.getColdBlock('0xabc'), BlockConsistencyError)
    })
})


// ---------------------------------------------------------------------------
// getLogs
// ---------------------------------------------------------------------------

describe('getLogs', () => {
    it('throws BlockConsistencyError for "after last accepted block" error (Avalanche)', async () => {
        let rpc = new Rpc(mockClient({
            eth_getLogs: {error: {code: -32000, message: 'requested to block is after last accepted block'}}
        }))
        await assert.rejects(rpc.getLogs(100, 100), BlockConsistencyError)
    })

    it('throws BlockConsistencyError for "block range extends beyond current head block" error', async () => {
        let rpc = new Rpc(mockClient({
            eth_getLogs: {error: {code: -32602, message: 'block range extends beyond current head block'}}
        }))
        await assert.rejects(rpc.getLogs(100, 100), BlockConsistencyError)
    })

    it('throws for other RPC errors', async () => {
        let rpc = new Rpc(mockClient({
            eth_getLogs: {error: {code: -32000, message: 'internal server error'}}
        }))
        await assert.rejects(rpc.getLogs(100, 100), RpcError)
    })
})


// ---------------------------------------------------------------------------
// logs bloom check — Avalanche C-Chain Helicon (ACP-194) headers
// ---------------------------------------------------------------------------

// Real Avalanche C-Chain block 95921422 (eth_getBlockByHash, tx hashes only).
// Both transactions reverted, eth_getLogs returns no logs, but since Helicon
// the header logsBloom commits to the blocks settled up to settledHeight.
const AVALANCHE_HELICON_BLOCK = {
    baseFeePerGas: '0x9de4087f',
    blobGasUsed: '0x0',
    blockExtraData: '0x',
    blockGasCost: '0x0',
    difficulty: '0x1',
    excessBlobGas: '0x0',
    extDataGasUsed: '0x0',
    extDataHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
    extraData: '0x000000000000',
    gasLimit: '0x4c4b400',
    gasUsed: '0xae3d5',
    hash: '0x7d9615bc4a672207c590fdc7ad30eb25f2f76d49b6b5e23a049f714cf76100c1',
    logsBloom: '0x00000000000000000000000000000001400000040000000000000200000000000000010000000000000000010000000000000004000001000800020000000000000000010800000008000008000000000000000000000400000008000000000000000000000008000000000200100020000000300000000000000010000400000000000000000000000000000000200000040010000020000000000000100001200000000000004000000200000000000000000040000000000000000000000000000002000000000004000000000000000001200000000004010000000000040000000000000000000000004020000008000000000000020000000000000000',
    minDelayExcess: '0x6e6965',
    minPriceExponent: '0x26af37c048d118',
    miner: '0x0100000000000000000000000000000000000000',
    mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    nonce: '0x0000000000000000',
    number: '0x5b7a50e',
    parentBeaconBlockRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
    parentHash: '0x7ff1105a0858b636c94682dce39437f1568320c900db9dbce80b68e8dce42a8e',
    receiptsRoot: '0x46ec3f69d5dafd87e7a94488e0aa7f5f22bca46d5aaf755fb59078edc30d04fe',
    settledExcess: '0x1c182a49a',
    settledGasNumerator: '0x58bfac',
    settledGasUnix: '0x6ab29b3c',
    settledHeight: '0x5b7a50c',
    sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
    size: '0x5ae',
    stateRoot: '0x6131c27f0e013b1964b1b32b26c3ae365316750d0e4591c902cb7d68fd5ba856',
    targetExponent: '0x2c5c860',
    timestamp: '0x6ab29b41',
    timestampMilliseconds: '0x1a0c9ae79cc',
    totalDifficulty: '0x0',
    transactions: [
        '0x3fd2a4378a9d2d895f4976004d47e528c640f178eaca15666527ac404af713f7',
        '0x9fbdfd341b4f53d50981bdfd0a9e590c8dd0f958e21051b2c41f1ca680bb942d'
    ],
    transactionsRoot: '0x3d3b6a9f46b3ea1094a4f86aadeb4511fa18a93e161651acea85cc51540b590c',
    uncles: [],
}


const HELICON_TX_HASHES = AVALANCHE_HELICON_BLOCK.transactions


function heliconReceipt(txHash: string, overrides: Record<string, unknown> = {}) {
    return {
        blockNumber: AVALANCHE_HELICON_BLOCK.number,
        blockHash: AVALANCHE_HELICON_BLOCK.hash,
        transactionIndex: toQty(HELICON_TX_HASHES.indexOf(txHash)),
        transactionHash: txHash,
        logs: [],
        ...overrides
    }
}


// same block as returned with `transactions: true`
const AVALANCHE_HELICON_BLOCK_WITH_TXS = {
    ...AVALANCHE_HELICON_BLOCK,
    transactions: HELICON_TX_HASHES.map((hash, idx) => ({
        blockNumber: AVALANCHE_HELICON_BLOCK.number,
        blockHash: AVALANCHE_HELICON_BLOCK.hash,
        transactionIndex: toQty(idx),
        hash,
        input: '0x'
    }))
}


function heliconClient(
    block: object,
    receipt: (txHash: string) => unknown = txHash => heliconReceipt(txHash)
) {
    return mockClient({
        eth_getBlockByHash: {result: block},
        eth_getBlockByNumber: {result: block},
        eth_getLogs: {result: []},
        eth_getTransactionReceipt: params => ({result: receipt(params[0])})
    })
}


const HELICON_HEIGHT = 95921422


describe('logs bloom check', () => {
    it('accepts a settlement block without logs when all tx receipts have no logs', async () => {
        let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK))
        let block = await rpc.getColdBlock(AVALANCHE_HELICON_BLOCK.hash, {logs: true})
        assert.strictEqual(block.height, HELICON_HEIGHT)
        assert.deepStrictEqual(block.logs, [])
    })

    it('accepts a settlement block without logs when fetched with transactions', async () => {
        let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK_WITH_TXS))
        let block = await rpc.getColdBlock(AVALANCHE_HELICON_BLOCK.hash, {logs: true, transactions: true})
        assert.strictEqual(block.height, HELICON_HEIGHT)
        assert.deepStrictEqual(block.logs, [])
    })

    it('rejects a settlement block without logs when a tx receipt is not available yet', async () => {
        let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK, txHash => {
            return txHash === HELICON_TX_HASHES[1] ? null : heliconReceipt(txHash)
        }))
        await assert.rejects(
            rpc.getColdBlock(AVALANCHE_HELICON_BLOCK.hash, {logs: true}),
            (err: any) => err instanceof BlockConsistencyError && /tx receipts are not available/.test(err.message)
        )
    })

    it('rejects a settlement block without logs when a tx receipt belongs to another block', async () => {
        let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK, txHash => {
            return heliconReceipt(txHash, {blockHash: '0x' + '11'.repeat(32)})
        }))
        await assert.rejects(
            rpc.getColdBlock(AVALANCHE_HELICON_BLOCK.hash, {logs: true}),
            (err: any) => err instanceof BlockConsistencyError && /tx receipts are not available/.test(err.message)
        )
    })

    it('rejects a settlement block without logs when a tx receipt has logs', async () => {
        let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK_WITH_TXS, txHash => {
            return heliconReceipt(txHash, {
                logs: [{
                    blockNumber: AVALANCHE_HELICON_BLOCK.number,
                    blockHash: AVALANCHE_HELICON_BLOCK.hash,
                    logIndex: '0x0',
                    transactionIndex: '0x0'
                }]
            })
        }))
        await assert.rejects(
            rpc.getColdBlock(AVALANCHE_HELICON_BLOCK.hash, {logs: true, transactions: true}),
            (err: any) => err instanceof BlockConsistencyError && /tx receipts have logs/.test(err.message)
        )
    })

    it('accepts a settlement block without transactions and logs without fetching receipts', async () => {
        let block = {...AVALANCHE_HELICON_BLOCK, transactions: []}
        let rpc = new Rpc(heliconClient(block, () => {
            throw new Error('eth_getTransactionReceipt must not be called')
        }))
        let result = await rpc.getColdBlock(block.hash, {logs: true})
        assert.deepStrictEqual(result.logs, [])
    })

    it('rejects a block without logs but with non-empty bloom when header has no settledHeight', async () => {
        let {settledHeight, ...header} = AVALANCHE_HELICON_BLOCK
        let rpc = new Rpc(heliconClient(header))
        await assert.rejects(
            rpc.getColdBlock(header.hash, {logs: true}),
            (err: any) => err instanceof BlockConsistencyError && /logs bloom is not empty/.test(err.message)
        )
    })

    it('does not check anything when disableLogsBloomCheck is set', async () => {
        let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK, () => null), undefined, {disableLogsBloomCheck: true})
        let block = await rpc.getColdBlock(AVALANCHE_HELICON_BLOCK.hash, {logs: true})
        assert.deepStrictEqual(block.logs, [])
    })

    describe('getHotSplit', () => {
        const hotReq = {
            range: {from: HELICON_HEIGHT, to: HELICON_HEIGHT},
            request: {logs: true},
            finalizedHeight: HELICON_HEIGHT
        }

        it('returns a settlement block whose tx receipts have no logs', async () => {
            let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK))
            let blocks = await rpc.getHotSplit(hotReq)
            assert.deepStrictEqual(blocks.map(b => b.height), [HELICON_HEIGHT])
            assert.deepStrictEqual(blocks[0].logs, [])
        })

        it('returns a settlement block with transactions: true', async () => {
            let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK_WITH_TXS))
            let blocks = await rpc.getHotSplit({...hotReq, request: {logs: true, transactions: true}})
            assert.deepStrictEqual(blocks.map(b => b.height), [HELICON_HEIGHT])
        })

        it('trims a settlement block whose tx receipts are not available yet', async () => {
            let rpc = new Rpc(heliconClient(AVALANCHE_HELICON_BLOCK, () => null))
            let blocks = await rpc.getHotSplit(hotReq)
            assert.deepStrictEqual(blocks, [])
        })
    })
})
