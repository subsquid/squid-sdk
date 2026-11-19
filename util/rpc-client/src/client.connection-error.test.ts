import * as http from 'node:http'
import type {AddressInfo} from 'node:net'
import {HttpError, HttpResponse} from '@subsquid/http-client'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {RpcClient} from './client'
import {RetryError, RpcError, RpcProtocolError} from './errors'

function httpError(status: number, body: unknown = ''): HttpError {
    return new HttpError(new HttpResponse(1, 'http://localhost', status, new Headers() as any, body, false))
}

describe('RpcClient.isConnectionError', () => {
    let client = new RpcClient({url: 'http://localhost:1', log: null})

    it.each([408, 429, 502, 503, 504, 520, 521, 522, 523, 524])('retries HTTP %i', (status) => {
        expect(client.isConnectionError(httpError(status))).toBe(true)
    })

    it.each([400, 401, 403, 404])('does not retry HTTP %i', (status) => {
        expect(client.isConnectionError(httpError(status))).toBe(false)
    })

    // a proxy in front of the node failed
    it.each([
        ['a text body', 'Uncaught exception'],
        ['an HTML page', '<html><body><h1>500 Internal Server Error</h1></body></html>'],
        ['an empty body', undefined],
        ['bytes', Buffer.from('Internal Server Error')],
        ['a JSON body that is not JSON-RPC', {message: 'Internal server error'}],
        ['a JSON body with an error string', {error: 'upstream failed'}],
        ['an error object with no JSON-RPC envelope', {error: {message: 'Internal Server Error'}}],
        ['an error object with a code but no envelope', {error: {code: 500, message: 'upstream failed'}}],
        ['an envelope with neither result nor error', {jsonrpc: '2.0', id: 1}],
        ['an empty JSON array', []],
        ['a JSON array of proxy errors', [{error: {message: 'Internal Server Error'}}]],
        ['a JSON string', 'Internal Server Error'],
        ['JSON null sent as text', 'null'],
    ])('retries HTTP 500 with %s', (_, body) => {
        expect(client.isConnectionError(httpError(500, body))).toBe(true)
    })

    // the node answered the request
    it.each([
        [
            'a JSON-RPC 1.0 error, as Bitcoin Core sends',
            {result: null, error: {code: -8, message: 'Block height out of range'}, id: 1},
        ],
        ['a JSON-RPC 2.0 error', {jsonrpc: '2.0', id: 1, error: {code: -32000, message: 'execution reverted'}}],
        [
            'a JSON-RPC 2.0 error with a null id',
            {jsonrpc: '2.0', id: null, error: {code: -32700, message: 'Parse error'}},
        ],
        ['a JSON-RPC result', {jsonrpc: '2.0', id: 1, result: '0x1'}],
        [
            'a batch answer',
            [
                {jsonrpc: '2.0', id: 1, result: '0x1'},
                {jsonrpc: '2.0', id: 2, error: {code: -32000, message: 'x'}},
            ],
        ],
        ['a JSON-RPC error sent as text', '{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"x"}}'],
        ['a JSON-RPC error sent as bytes', Buffer.from('{"result":null,"error":{"code":-8,"message":"x"},"id":1}')],
    ])('does not retry HTTP 500 with %s', (_, body) => {
        expect(client.isConnectionError(httpError(500, body))).toBe(false)
    })

    it('judges only a 500 by its body', () => {
        let jsonRpcError = {jsonrpc: '2.0', id: 1, error: {code: -32000, message: 'x'}}
        expect(client.isConnectionError(httpError(400, 'Uncaught exception'))).toBe(false)
        expect(client.isConnectionError(httpError(502, jsonRpcError))).toBe(true)
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
        [httpError(500, 'Uncaught exception'), 'http'],
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

    it('retries a bare HTTP 500 from a proxy', async () => {
        statuses = [500]
        let client = new RpcClient({url, log: null, retryAttempts: 1, retrySchedule: [0]})

        await expect(client.call('eth_blockNumber')).resolves.toBe('0x1')
        expect(client.getMetrics().retriedErrors).toEqual({http: 1})
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

interface Reply {
    status: number
    contentType: string
    body: string
}

describe('RpcClient through the HTTP transport', () => {
    let server: http.Server
    let url: string
    let replies: Reply[]

    beforeEach(async () => {
        replies = []
        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', (chunk) => {
                body += chunk
            })
            req.on('end', () => {
                let calls = JSON.parse(body)
                let answer = (call: {id: number}) => ({jsonrpc: '2.0', id: call.id, result: '0x1'})
                let reply = replies.shift() ?? {
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(Array.isArray(calls) ? calls.map(answer) : answer(calls)),
                }
                res.writeHead(reply.status, {'content-type': reply.contentType})
                res.end(reply.body)
            })
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    afterEach(async () => {
        // a test that fails before closing its client leaves a keep-alive socket open
        server.closeAllConnections()
        await new Promise<void>((resolve) => server.close(() => resolve()))
    })

    function client(retryAttempts = 1): RpcClient {
        return new RpcClient({url, log: null, retryAttempts, retrySchedule: [0]})
    }

    const JSON_RPC_ERROR = JSON.stringify({
        result: null,
        error: {code: -8, message: 'Block height out of range'},
        id: 1,
    })

    // a proxy in front of the node failed
    it.each<[string, Reply]>([
        ['plain text', {status: 500, contentType: 'text/plain;charset=UTF-8', body: 'Uncaught exception'}],
        ['an HTML page', {status: 500, contentType: 'text/html', body: '<h1>500 Internal Server Error</h1>'}],
        ['an empty body labeled as JSON', {status: 500, contentType: 'application/json', body: ''}],
        [
            'a malformed body labeled as JSON',
            {status: 500, contentType: 'application/json', body: '{"error": "upstream'},
        ],
        [
            'a proxy error object',
            {status: 500, contentType: 'application/json', body: '{"error":{"message":"Internal Server Error"}}'},
        ],
        ['an untyped body', {status: 500, contentType: '', body: 'Internal Server Error'}],
    ])('retries a 500 with %s', async (_, reply) => {
        replies = [reply]
        let rpc = client()

        await expect(rpc.call('eth_blockNumber')).resolves.toBe('0x1')
        expect(rpc.getMetrics().retriedErrors).toEqual({http: 1})
        rpc.close()
    })

    // the node answered the request
    it.each<[string, Reply]>([
        ['a JSON-RPC error', {status: 500, contentType: 'application/json', body: JSON_RPC_ERROR}],
        ['a JSON-RPC error labeled as text', {status: 500, contentType: 'text/plain', body: JSON_RPC_ERROR}],
    ])('fails on a 500 with %s', async (_, reply) => {
        replies = [reply]
        let rpc = client()

        await expect(rpc.call('getblockhash', [1e9])).rejects.toBeInstanceOf(HttpError)
        expect(rpc.getMetrics().retriedErrors).toEqual({})
        rpc.close()
    })

    it('retries a gateway error whose JSON-labeled body does not parse', async () => {
        replies = [{status: 502, contentType: 'application/json', body: ''}]
        let rpc = client()

        await expect(rpc.call('eth_blockNumber')).resolves.toBe('0x1')
        rpc.close()
    })

    it('fails a 400 whose JSON-labeled body does not parse with its status', async () => {
        replies = [{status: 400, contentType: 'application/json', body: 'bad request'}]
        let rpc = client()

        let err = await rpc.call('eth_blockNumber').catch((e) => e)
        expect(err).toBeInstanceOf(HttpError)
        expect(err.response.status).toBe(400)
        expect(err.response.body).toBe('bad request')
        rpc.close()
    })

    it('still rejects malformed JSON in a successful response', async () => {
        replies = [{status: 200, contentType: 'application/json', body: '{"jsonrpc":'}]
        let rpc = client()

        await expect(rpc.call('eth_blockNumber')).rejects.toBeInstanceOf(RpcProtocolError)
        rpc.close()
    })

    describe('a whole-batch error', () => {
        const ENVELOPE: Reply = {
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({jsonrpc: '2.0', id: null, error: {code: -32003, message: 'request rejected'}}),
        }

        it('carries the method of a batch of one method', async () => {
            replies = [ENVELOPE]
            let rpc = client(0)
            let batch = [
                {method: 'debug_traceBlockByHash', params: ['0x01']},
                {method: 'debug_traceBlockByHash', params: ['0x02']},
            ]

            let err = await rpc.batchCall(batch).catch((e) => e)
            expect(err).toBeInstanceOf(RpcError)
            expect(err.code).toBe(-32003)
            expect(err.rpcMethod).toBe('debug_traceBlockByHash')
            rpc.close()
        })

        it('carries no method for a batch of several', async () => {
            replies = [ENVELOPE]
            let rpc = client(0)
            let batch = [
                {method: 'debug_traceBlockByHash', params: ['0x01']},
                {method: 'eth_getBlockByHash', params: ['0x01', false]},
            ]

            let err = await rpc.batchCall(batch).catch((e) => e)
            expect(err).toBeInstanceOf(RpcError)
            expect(err.rpcMethod).toBeUndefined()
            rpc.close()
        })
    })
})
