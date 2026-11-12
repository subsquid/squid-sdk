import * as http from 'node:http'
import type {AddressInfo} from 'node:net'
import * as zlib from 'node:zlib'
import {afterEach, describe, expect, it} from 'vitest'
import {RpcClient} from './client'
import {RpcResponseTooLargeError} from './errors'

describe('CallOptions.maxResponseSize', () => {
    let server: http.Server | undefined
    let requests = 0

    afterEach(async () => {
        await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()))
        server = undefined
        requests = 0
    })

    // Answers every call with a result string of `size` characters.
    async function start(size: number, gzip = false): Promise<RpcClient> {
        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', (chunk) => {
                body += chunk
            })
            req.on('end', () => {
                requests += 1
                let call = JSON.parse(body)
                let payload = Buffer.from(JSON.stringify({jsonrpc: '2.0', id: call.id, result: 'x'.repeat(size)}))
                res.setHeader('content-type', 'application/json')
                if (gzip) {
                    res.setHeader('content-encoding', 'gzip')
                    payload = zlib.gzipSync(payload)
                }
                res.end(payload)
            })
        })
        await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
        let {port} = server.address() as AddressInfo
        return new RpcClient({url: `http://127.0.0.1:${port}`, retryAttempts: 5, retrySchedule: [0], log: null})
    }

    it('reads a response within the limit', async () => {
        let client = await start(1000)
        await expect(client.call('m', [], {maxResponseSize: 2000})).resolves.toHaveLength(1000)
    })

    it('fails a larger response once, without retrying it', async () => {
        let client = await start(10_000)
        await expect(client.call('m', [], {maxResponseSize: 2000})).rejects.toBeInstanceOf(RpcResponseTooLargeError)
        expect(requests).toBe(1)
    })

    it('counts the decompressed body', async () => {
        // ~100 kB of repeated characters compresses to well under the limit.
        let client = await start(100_000, true)
        await expect(client.call('m', [], {maxResponseSize: 10_000})).rejects.toBeInstanceOf(RpcResponseTooLargeError)
    })

    it('reads any size when no limit is given', async () => {
        let client = await start(100_000)
        await expect(client.call('m', [])).resolves.toHaveLength(100_000)
    })
})
