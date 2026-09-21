import {RpcClient, RpcError} from '@subsquid/rpc-client'
import {RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import {BlockConsistencyError} from '@subsquid/util-internal-ingest-tools'
import assert from 'assert'
import { describe, it } from 'vitest'
import {Rpc} from './rpc'


interface MockResponse {
    result?: unknown
    error?: RpcErrorInfo
}


/**
 * Creates a minimal RpcClient mock that reproduces the validateResult / validateError
 * dispatch logic of the real client without any transport.
 */
function mockClient(responses: Record<string, MockResponse>): RpcClient {
    function dispatch(method: string, options: any): unknown {
        let resp = responses[method]
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
        call(method: string, _params?: any[], options?: any) {
            try {
                return Promise.resolve(dispatch(method, options))
            } catch (err) {
                return Promise.reject(err)
            }
        },
        batchCall(batch: any[], options?: any) {
            try {
                let results = batch.map(({method}) => dispatch(method, options))
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
