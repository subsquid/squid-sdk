import {RpcClient, RpcError} from '@subsquid/rpc-client'
import {isDataConsistencyError} from '@subsquid/util-internal-ingest-tools'
import {RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import assert from 'assert'
import {describe, it} from 'node:test'
import {EvmRpcDataSource} from './client'


const GENESIS_HASH = '0x' + '00'.repeat(32)
const BLOCK1_HASH = '0x' + '11'.repeat(32)
const EMPTY_LOGS_BLOOM = '0x' + '00'.repeat(256)


type MockHandler = () => {result?: unknown, error?: RpcErrorInfo}


/**
 * RpcClient mock with per-method handler functions, allowing stateful/sequential responses.
 * supportsNotifications() returns false to force the HTTP polling path.
 */
function mockRpc(handlers: Record<string, MockHandler>): RpcClient {
    function dispatch(method: string, options: any): unknown {
        let handler = handlers[method]
        let resp = handler ? handler() : {result: null}
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
        getConcurrency() { return 10 },
        supportsNotifications() { return false }
    } as unknown as RpcClient
}


function block1() {
    return {
        number: '0x1',
        hash: BLOCK1_HASH,
        parentHash: GENESIS_HASH,
        logsBloom: EMPTY_LOGS_BLOOM,
        transactions: []
    }
}


describe('EvmRpcDataSource retry behavior', () => {
    it('retries and delivers block after "block range extends beyond current head block" from eth_getLogs', async () => {
        let getLogsCalls = 0

        let ds = new EvmRpcDataSource({
            rpc: mockRpc({
                eth_blockNumber: () => ({result: '0x1'}),
                eth_getBlockByNumber: () => ({result: block1()}),
                eth_getLogs: () => {
                    if (getLogsCalls++ === 0) {
                        return {error: {code: -32602, message: 'block range extends beyond current head block'}}
                    }
                    return {result: []}
                }
            }),
            finalityConfirmation: 0,
            headPollInterval: 0
        })

        let deliveredBlocks: any[] = []
        await ds.processHotBlocks(
            [{range: {from: 1, to: 1}, request: {logs: [{}]}}],
            {height: 0, hash: GENESIS_HASH, top: []},
            async upd => { deliveredBlocks.push(...upd.blocks) }
        )

        assert.ok(getLogsCalls >= 2, `eth_getLogs should have been called at least twice, got ${getLogsCalls}`)
        assert.strictEqual(deliveredBlocks.length, 1)
        assert.strictEqual(deliveredBlocks[0].header.hash, BLOCK1_HASH)
    })

    it('retries and delivers block after "after last accepted block" from eth_getLogs (Avalanche)', async () => {
        let getLogsCalls = 0

        let ds = new EvmRpcDataSource({
            rpc: mockRpc({
                eth_blockNumber: () => ({result: '0x1'}),
                eth_getBlockByNumber: () => ({result: block1()}),
                eth_getLogs: () => {
                    if (getLogsCalls++ === 0) {
                        return {error: {code: -32000, message: 'requested to block is after last accepted block'}}
                    }
                    return {result: []}
                }
            }),
            finalityConfirmation: 0,
            headPollInterval: 0
        })

        let deliveredBlocks: any[] = []
        await ds.processHotBlocks(
            [{range: {from: 1, to: 1}, request: {logs: [{}]}}],
            {height: 0, hash: GENESIS_HASH, top: []},
            async upd => { deliveredBlocks.push(...upd.blocks) }
        )

        assert.ok(getLogsCalls >= 2, `eth_getLogs should have been called at least twice, got ${getLogsCalls}`)
        assert.strictEqual(deliveredBlocks.length, 1)
        assert.strictEqual(deliveredBlocks[0].header.hash, BLOCK1_HASH)
    })

    it('propagates unexpected eth_getLogs error without retrying', async () => {
        let getLogsCalls = 0

        let ds = new EvmRpcDataSource({
            rpc: mockRpc({
                eth_blockNumber: () => ({result: '0x1'}),
                eth_getBlockByNumber: () => ({result: block1()}),
                eth_getLogs: () => {
                    getLogsCalls++
                    return {error: {code: -32000, message: 'internal server error'}}
                }
            }),
            finalityConfirmation: 0,
            headPollInterval: 0
        })

        let err = await ds.processHotBlocks(
            [{range: {from: 1, to: 1}, request: {logs: [{}]}}],
            {height: 0, hash: GENESIS_HASH, top: []},
            async () => {}
        ).catch(e => e)

        assert.ok(err instanceof RpcError, 'should throw RpcError')
        assert.ok(!isDataConsistencyError(err), 'error should not be retriable')
        assert.strictEqual(getLogsCalls, 1, 'eth_getLogs should not have been retried')
    })
})
