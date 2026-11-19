import {createServer} from 'node:http'
import {RpcClient} from '@subsquid/rpc-client'
import type {RpcRequest} from '@subsquid/rpc-client/lib/interfaces'
import {describe, expect, it} from 'vitest'
import {Rpc, type RpcOptions} from './rpc'

type RpcReply = {error: {code: number; message: string}} | {result: unknown}

// Retry fast in tests; the defaults pause for seconds.
const FAST_RETRY: RpcOptions = {internalErrorRetry: {attempts: 3, backoffMs: [0]}}

async function withRpcServer(
    replies: RpcReply[],
    run: (rpc: Rpc, client: RpcClient, requests: RpcRequest[], warnings: string[]) => Promise<void>,
    rpcOptions: RpcOptions = FAST_RETRY,
): Promise<void> {
    const requests: RpcRequest[] = []
    const warnings: string[] = []
    const pendingReplies = [...replies]
    // Answers each JSON-RPC request (single or batch) with the next queued reply.
    const answer = (request: RpcRequest) => {
        requests.push(request)
        return {jsonrpc: '2.0', id: request.id, ...pendingReplies.shift()}
    }
    const server = createServer((req, res) => {
        let body = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => {
            body += chunk
        })
        req.on('end', () => {
            const request = JSON.parse(body)
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(Array.isArray(request) ? request.map(answer) : answer(request)))
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
    const log = {warn: (_info: unknown, msg: string) => void warnings.push(msg)}
    const rpc = new Rpc(client, log as any, rpcOptions)

    try {
        await run(rpc, client, requests, warnings)
    } finally {
        client.close()
        await new Promise<void>((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()))
            server.closeAllConnections()
        })
    }
}

describe('getBlock RPC error handling', () => {
    it('retries a transient -32603 Service overloaded response through the client backoff', async () => {
        await withRpcServer(
            [{error: {code: -32603, message: 'Service overloaded'}}, {result: null}],
            async (rpc, client, requests) => {
                await expect(rpc.getBlock(42)).resolves.toBeNull()
                expect(requests).toHaveLength(2)
                expect(requests.map((request) => request.params?.[0])).toEqual([42, 42])
                expect(client.getMetrics().retriedErrors).toEqual({retry: 1})
            },
        )
    })

    it('retries -32603 Internal error a bounded number of times and logs each retry', async () => {
        await withRpcServer(
            [{error: {code: -32603, message: 'Internal error'}}, {result: null}],
            async (rpc, client, requests, warnings) => {
                await expect(rpc.getBlock(42)).resolves.toBeNull()
                expect(requests.map((request) => request.params?.[0])).toEqual([42, 42])
                // Retried by Rpc, not by the client's unlimited backoff - but counted in the
                // client's metrics, so the retry shows up in `sqd_chain_rpc_retried_errors_total`.
                expect(client.getMetrics().retriedErrors).toEqual({internal: 1})
                expect(warnings).toEqual(['getBlock failed with "Internal error" (code -32603), retrying in 0ms'])
            },
        )
    })

    it('fails after the attempts are used up when -32603 Internal error persists', async () => {
        const internal = {error: {code: -32603, message: 'Internal error'}}
        await withRpcServer(
            [internal, internal, internal, {result: null}],
            async (rpc, _client, requests, warnings) => {
                await expect(rpc.getBlock(42)).rejects.toMatchObject({
                    name: 'RpcError',
                    code: -32603,
                    message: 'Internal error',
                })
                expect(requests).toHaveLength(3)
                expect(warnings).toHaveLength(2)
            },
        )
    })

    it('applies the bounded Internal error retry to getBlockBatch', async () => {
        await withRpcServer(
            [{error: {code: -32603, message: 'Internal error'}}, {result: null}, {result: null}, {result: null}],
            async (rpc, _client, requests, warnings) => {
                await expect(rpc.getBlockBatch([41, 42])).resolves.toEqual([null, null])
                expect(requests.map((request) => request.params?.[0])).toEqual([41, 42, 41, 42])
                expect(warnings).toEqual(['getBlock failed with "Internal error" (code -32603), retrying in 0ms'])
            },
        )
    })

    it('counts a batch retried in halves in the client metrics', async () => {
        // The overload fails the batch as a whole; Rpc retries it in halves, with the client's own
        // retries off, so the retry has to be recorded in the client's metrics explicitly.
        await withRpcServer(
            [{error: {code: -32603, message: 'Service overloaded'}}, {result: null}, {result: null}, {result: null}],
            async (rpc, client, requests) => {
                await expect(rpc.getBlockBatch([41, 42])).resolves.toEqual([null, null])
                expect(requests.map((request) => request.params?.[0])).toEqual([41, 42, 41, 42])
                expect(client.getMetrics().retriedErrors).toEqual({retry: 1})
            },
        )
    })

    it('does not retry Internal error when attempts is 1', async () => {
        await withRpcServer(
            [{error: {code: -32603, message: 'Internal error'}}, {result: null}],
            async (rpc, _client, requests) => {
                await expect(rpc.getBlock(42)).rejects.toMatchObject({name: 'RpcError', code: -32603})
                expect(requests).toHaveLength(1)
            },
            {internalErrorRetry: {attempts: 1}},
        )
    })

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
