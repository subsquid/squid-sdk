import * as http from 'node:http'
import type {AddressInfo} from 'node:net'
import {HttpError, HttpResponse} from '@subsquid/http-client'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {RpcClient} from './client'
import {RetryError, RpcError} from './errors'

function httpError(status: number): HttpError {
    return new HttpError(new HttpResponse(1, 'http://localhost', status, new Headers() as any, '', false))
}

describe('RpcClient.isConnectionError', () => {
    let client = new RpcClient({url: 'http://localhost:1', log: null})

    it.each([408, 429, 502, 503, 504, 520, 521, 522, 523, 524])('retries HTTP %i', (status) => {
        expect(client.isConnectionError(httpError(status))).toBe(true)
    })

    it.each([400, 401, 403, 404, 500])('does not retry HTTP %i', (status) => {
        expect(client.isConnectionError(httpError(status))).toBe(false)
    })
})

describe('RpcClient.getRetryKind', () => {
    let client = new RpcClient({url: 'http://localhost:1', log: null})

    it.each([
        [httpError(429), 'rate_limit'],
        [new RpcError({code: -32000, message: 'rate limit exceeded'}), 'rate_limit'],
        [httpError(504), 'timeout'],
        [httpError(524), 'timeout'],
        [new RpcError({code: -32000, message: 'execution timeout'}), 'timeout'],
        [httpError(502), 'http'],
        [httpError(521), 'http'],
        [new RetryError(), 'retry'],
    ])('classifies %s as %s', (err, kind) => {
        expect(client.getRetryKind(err)).toBe(kind)
    })
})

describe('RpcClient retried error metrics', () => {
    let server: http.Server
    let url: string
    let statuses: number[]

    beforeEach(async () => {
        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', (chunk) => {
                body += chunk
            })
            req.on('end', () => {
                let {id} = JSON.parse(body)
                let status = statuses.shift() ?? 200
                if (status == 200) {
                    res.writeHead(200, {'content-type': 'application/json'})
                    res.end(JSON.stringify({jsonrpc: '2.0', id, result: '0x1'}))
                } else {
                    res.writeHead(status, {'content-type': 'text/plain'})
                    res.end('unavailable')
                }
            })
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    afterEach(async () => {
        await new Promise<void>((resolve) => server.close(() => resolve()))
    })

    it('counts every retried error by kind', async () => {
        statuses = [429, 429, 502]
        let client = new RpcClient({url, log: null, retryAttempts: 3, retrySchedule: [0]})

        await expect(client.call('eth_blockNumber')).resolves.toBe('0x1')
        expect(client.getMetrics().retriedErrors).toEqual({rate_limit: 2, http: 1})
        client.close()
    })

    it('does not count the error that fails the request', async () => {
        statuses = [429, 502]
        let client = new RpcClient({url, log: null, retryAttempts: 1, retrySchedule: [0]})

        await expect(client.call('eth_blockNumber')).rejects.toThrow()
        expect(client.getMetrics().retriedErrors).toEqual({rate_limit: 1})
        client.close()
    })

    it('does not count an error when retries are disabled', async () => {
        statuses = [502]
        let client = new RpcClient({url, log: null, retrySchedule: [0]})

        await expect(client.call('eth_blockNumber')).rejects.toThrow()
        expect(client.getMetrics().retriedErrors).toEqual({})
        client.close()
    })

    it('reports nothing before the first retry', () => {
        let client = new RpcClient({url, log: null})
        expect(client.getMetrics().retriedErrors).toEqual({})
        client.close()
    })
})
