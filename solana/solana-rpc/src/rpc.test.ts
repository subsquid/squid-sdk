import {createServer} from 'node:http'
import {RpcClient} from '@subsquid/rpc-client'
import type {RpcRequest} from '@subsquid/rpc-client/lib/interfaces'
import {describe, expect, it} from 'vitest'
import {Rpc} from './rpc'

type RpcReply = {error: {code: number; message: string}} | {result: unknown}

async function withRpcServer(
    replies: RpcReply[],
    run: (rpc: Rpc, client: RpcClient, requests: RpcRequest[]) => Promise<void>,
): Promise<void> {
    const requests: RpcRequest[] = []
    const pendingReplies = [...replies]
    const server = createServer((req, res) => {
        let body = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => {
            body += chunk
        })
        req.on('end', () => {
            const request = JSON.parse(body)
            requests.push(request)
            const response = pendingReplies.shift()
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({jsonrpc: '2.0', id: request.id, ...response}))
        })
    })

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject)
            resolve()
        })
    })

    const address = server.address()
    if (address == null || typeof address === 'string') throw new Error('RPC test server has no TCP address')

    const client = new RpcClient({
        url: `http://127.0.0.1:${address.port}`,
        retryAttempts: 1,
        retrySchedule: [0],
        log: null,
    })
    const rpc = new Rpc(client, {warn() {}} as any)

    try {
        await run(rpc, client, requests)
    } finally {
        client.close()
        await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()))
            server.closeAllConnections()
        })
    }
}

describe('getBlock RPC error handling', () => {
    it.each(['Service overloaded', 'Internal error'])(
        'retries transient -32603 %s response and then succeeds',
        async (message) => {
            await withRpcServer([{error: {code: -32603, message}}, {result: null}], async (rpc, client, requests) => {
                await expect(rpc.getBlock(42)).resolves.toBeNull()
                expect(requests).toHaveLength(2)
                expect(requests.map((request) => request.params?.[0])).toEqual([42, 42])
                expect(client.getMetrics().retriedErrors).toEqual({retry: 1})
            })
        },
    )

    it.each([
        {message: 'Block not available for slot 42', expected: undefined},
        {message: 'Slot 42 was skipped', expected: 'skipped'},
    ])('preserves the existing response for $message', async ({message, expected}) => {
        await withRpcServer([{error: {code: -32000, message}}], async (rpc, client, requests) => {
            await expect(rpc.getBlock(42)).resolves.toBe(expected)
            expect(requests).toHaveLength(1)
            expect(client.getMetrics().retriedErrors).toEqual({})
        })
    })

    it('leaves unrelated RPC errors fatal', async () => {
        await withRpcServer(
            [{error: {code: -32603, message: 'State root mismatch'}}],
            async (rpc, client, requests) => {
                await expect(rpc.getBlock(42)).rejects.toMatchObject({
                    name: 'RpcError',
                    code: -32603,
                    message: 'State root mismatch',
                })
                expect(requests).toHaveLength(1)
                expect(client.getMetrics().retriedErrors).toEqual({})
            },
        )
    })
})
