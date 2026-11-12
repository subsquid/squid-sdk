import {createServer, type Server} from 'node:http'
import type {AddressInfo} from 'node:net'
import {RpcClient} from '@subsquid/rpc-client'
import {afterEach, describe, expect, it} from 'vitest'
import {Rpc} from './rpc'

let server: Server | undefined
let client: RpcClient | undefined

afterEach(async () => {
    client?.close()
    client = undefined
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()))
    server = undefined
})

describe('Rpc batch retries in halves', () => {
    it('counts the retry in the client metrics', async () => {
        // Rate-limits any batch of more than one call; single calls are answered.
        server = createServer((req, res) => {
            let body = ''
            req.on('data', (c) => (body += c))
            req.on('end', () => {
                let parsed = JSON.parse(body)
                let calls: any[] = Array.isArray(parsed) ? parsed : [parsed]
                let answers = calls.map((c) =>
                    calls.length > 1
                        ? {jsonrpc: '2.0', id: c.id, error: {code: 429, message: 'Too many requests'}}
                        : {jsonrpc: '2.0', id: c.id, result: String(c.params[0]).padStart(64, '0')},
                )
                res.setHeader('content-type', 'application/json')
                res.end(JSON.stringify(Array.isArray(parsed) ? answers : answers[0]))
            })
        })
        await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
        client = new RpcClient({url: `http://127.0.0.1:${(server!.address() as AddressInfo).port}`, retryAttempts: 0})
        let rpc = new Rpc({client})

        // The batch fails as a whole and is retried in halves by Rpc, with the client's retries off.
        let hashes = await (rpc as any).getBlockHashes([1, 2])

        expect(hashes).toEqual(['1'.padStart(64, '0'), '2'.padStart(64, '0')])
        let retried = client.getMetrics().retriedErrors
        expect(Object.values(retried).reduce((a, b) => a + b, 0)).toBe(1)
    })
})
