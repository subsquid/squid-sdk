import {createServer, type Server} from 'node:http'
import type {AddressInfo} from 'node:net'
import path from 'node:path'
import {redactRpcUrl} from '@subsquid/rpc-client'
import {afterEach, describe, expect, it} from 'vitest'

// The pool runs its RPC clients in worker threads, which load the compiled worker script, so the
// compiled module is loaded at run time (CI builds before it tests). Only its types come from the
// source: a static import of `../lib` would break the build, which empties `lib` first.
const {RemoteRpcPool}: typeof import('./rpc-remote') = require(path.join(__dirname, '../lib/rpc-remote'))
type RemoteRpcPool = import('./rpc-remote').RemoteRpcPool

const B58 = (n: number) => `${'1'.repeat(31)}${'23456789'[n % 8]}`

function block(slot: number) {
    return {
        blockHeight: slot,
        blockTime: 1_700_000_000 + slot,
        blockhash: B58(slot),
        parentSlot: slot - 1,
        previousBlockhash: B58(slot - 1),
        transactions: [],
        rewards: [],
    }
}

let server: Server | undefined
let pool: RemoteRpcPool | undefined

afterEach(async () => {
    pool?.close()
    pool = undefined
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()))
    server = undefined
})

/** A JSON-RPC endpoint that answers `getBlock` from `errors` first (per slot, once each), then with a block. */
async function endpoint(
    errors: Record<number, {code: number; message: string}>,
): Promise<{url: string; requests: () => number}> {
    let requests = 0
    let pending = new Map(Object.entries(errors).map(([slot, e]) => [Number(slot), e]))
    let answer = (req: any) => {
        requests += 1
        let slot = req.params?.[0] as number
        let error = pending.get(slot)
        if (error) {
            pending.delete(slot)
            return {jsonrpc: '2.0', id: req.id, error}
        }
        return {jsonrpc: '2.0', id: req.id, result: block(slot)}
    }
    server = createServer((req, res) => {
        let body = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
            let parsed = JSON.parse(body)
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(Array.isArray(parsed) ? parsed.map(answer) : answer(parsed)))
        })
    })
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
    return {url: `http://127.0.0.1:${(server!.address() as AddressInfo).port}`, requests: () => requests}
}

describe('RemoteRpcPool metrics', {timeout: 30_000}, () => {
    it('reports the RPC traffic and retries of its worker threads', async () => {
        let {url, requests} = await endpoint({
            10: {code: -32603, message: 'Service overloaded'}, // retried by the client
            11: {code: -32603, message: 'Internal error'}, // retried by Rpc, a bounded number of times
        })
        pool = new RemoteRpcPool(2, {url, retryAttempts: 3, retrySchedule: [0]})

        expect(await pool.getBlock(10)).toMatchObject({blockhash: B58(10)})
        expect(await pool.getBlock(11)).toMatchObject({blockhash: B58(11)})
        expect(await pool.getBlock(12)).toMatchObject({blockhash: B58(12)})

        let metrics = await pool.getRpcMetrics()
        expect(metrics.url).toBe(redactRpcUrl(url))
        expect(metrics.retriedErrors).toEqual({retry: 1, internal: 1})
        // 5 requests reached the endpoint; the 2 error replies were retried, the 3 blocks served
        expect(requests()).toBe(5)
        expect(metrics.requestsServed).toBe(3)
    })

    it('reports zeros, not nothing, before any request', async () => {
        let {url} = await endpoint({})
        pool = new RemoteRpcPool(1, {url})

        expect(await pool.getRpcMetrics()).toMatchObject({url: redactRpcUrl(url), requestsServed: 0, retriedErrors: {}})
    })
})
