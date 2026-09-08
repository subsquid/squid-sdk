import { describe, it, expect } from 'vitest'
import { RetryError, RpcError } from '@subsquid/rpc-client'
import { loadBlock } from './helpers/fixture-loader'
import { Rpc } from '../src/rpc'

/**
 * Minimal client mirroring RpcClient.receiveResult + retry-on-RetryError: a
 * `validateError` that throws RetryError advances through the queued responses,
 * exactly as the real client re-enqueues and retries the call.
 */
class RetryingMockClient {
    public attempts = 0
    public url = 'mock://test'
    constructor(private responses: ({ result: any } | { error: { code: number; message: string } })[]) {}
    getConcurrency(): number { return 1 }
    isConnectionError(): boolean { return false }
    async call(method: string, params: any[] | undefined, options?: any): Promise<any> {
        for (let i = 0; i < 20; i++) {
            const res = this.responses[Math.min(this.attempts, this.responses.length - 1)]
            this.attempts++
            try {
                if ('error' in res) {
                    if (options?.validateError) return options.validateError(res.error, { method, params })
                    throw new RpcError(res.error as any)
                }
                return options?.validateResult ? options.validateResult(res.result, { method, params }) : res.result
            } catch (err) {
                if (err instanceof RetryError) continue
                throw err
            }
        }
        throw new Error('retry limit exceeded')
    }
}

describe('Rpc.getLatestBlockhash finalized-head probe', () => {
    it('retries the transient "invalid block height" error instead of crashing the dump', async () => {
        const fixtureBlock = loadBlock('ethereum', 18000000)
        // uniblock returns this for the `finalized` tag when its load-balanced
        // backend lags behind the finalized pointer; a later attempt hits a
        // healthy backend and serves the block.
        const client = new RetryingMockClient([
            { error: { code: -32603, message: 'invalid block height: 57603085' } },
            { result: fixtureBlock },
        ])
        const rpc = new Rpc({ client: client as any })

        const head = await rpc.getLatestBlockhash('finalized')

        expect(head.hash).toEqual(fixtureBlock.hash)
        expect(client.attempts).toBeGreaterThanOrEqual(2) // proves it retried rather than crashed
    })

    it('still surfaces genuine RPC errors on the finalized-head probe', async () => {
        const client = new RetryingMockClient([
            { error: { code: -32000, message: 'execution reverted' } },
        ])
        const rpc = new Rpc({ client: client as any })

        await expect(rpc.getLatestBlockhash('finalized')).rejects.toThrow()
    })
})
