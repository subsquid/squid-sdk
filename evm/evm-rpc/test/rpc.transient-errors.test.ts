import * as http from 'node:http'
import type {AddressInfo} from 'node:net'
import {HttpError, HttpResponse} from '@subsquid/http-client'
import {RetryError, RpcError} from '@subsquid/rpc-client'
import {DataValidationError} from '@subsquid/util-internal-validation'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import {EvmRpcClient} from '../src/rpc-client'
import {qty2Int} from '../src/util'
import {loadBlock} from './helpers/fixture-loader'

// Shapes of provider and proxy errors that crashed dumps or restarted real-time
// ingestion, although the same call succeeds once repeated.
const TRANSIENT: [number, string][] = [
    [-32429, 'Throughput limit 1000 CUs/sec for this project has been exceeded. Please upgrade your plan at <url>'],
    [-32603, 'gave up retrying on network-level after 625.08259ms: 1 upstream not synced'],
    [-32603, 'gave up retrying on network-level after 1.3s: 1 upstream transport errors'],
    [-32603, 'gave up retrying on network-level after 1.1s: 1 upstream validation mismatch'],
    [-32603, 'failsafe timeout policy exceeded on network-level after 30s: dynamic timeout exceeded'],
    [-32603, 'context canceled'],
    [
        -32700,
        'cannot parse json-rpc response: "Syntax error at index 1: invalid char upstream connect error or disconnect"',
    ],
    [1, 'no available upstreams to process a request. Cause - node-1 - Upstream height 75651020 is less than 75651022'],
    [-32503, 'Errors from the following providers prevented the request from being fulfilled: ProviderA.'],
    [-32603, 'We are not able to process your request at this time. Please contact support.'],
    [-32001, 'Unable to complete request at this time.'],
    [19, 'Temporary internal error. Please retry, trace-id: 0123'],
    [-32000, 'could not find results for height #96891842'],
    [-32000, 'block result not found for height 1000'],
    [-32014, 'block not found with number 0x12b4afe0'],
    [-32000, 'finalized block not found'],
    [-32602, "Block with such an ID doesn't exist yet"],
    [
        -32000,
        'failed to get block by number: height 101 must be less than or equal to the current blockchain height 100',
    ],
]

// Configuration or data problems: retrying them would stall silently.
const PERMANENT: [number, string][] = [
    [-32601, 'The method debug_traceBlockByHash does not exist/is not available'],
    [-32601, 'method ignored by upstream: gave up retrying on network-level after 1ms: 1 upstream method ignored'],
    [-32603, 'all upstream attempts failed (1 upstream unsupported method, 1 upstream not synced)'],
    [-32503, 'ProviderA does not support chainId(s): 98867 for JsonRpc.'],
    [-32401, 'authenticated API key required for method'],
    [27, 'Unknown state. First available state is 14875359'],
    [-32000, 'historical state is not available'],
    [-32000, 'hash 0xabc is not currently canonical'],
    [-32003, 'tracing failed: insufficient funds for gas * price + value'],
    // advice on a rejected request, worded like a transient failure
    [-32602, 'Invalid params; please retry with a smaller block range'],
    [-32000, 'query exceeds limit, please retry with a smaller block range'],
]

// A proxy wraps each upstream attempt into nested causes under `data`.
function proxyError(
    code: number,
    message: string,
    leaf: {code: string; message?: string; details?: {originalCode: number}},
) {
    return new RpcError({
        code,
        message,
        data: {
            code: 'ErrFailsafeRetryExceeded',
            cause: {
                code: 'ErrUpstreamsExhausted',
                cause: [{code: 'ErrUpstreamRequest', cause: leaf}],
            },
        },
    })
}

const PROXY: [string, RpcError, boolean][] = [
    [
        'every upstream over capacity, reported as method-not-found',
        proxyError(-32601, 'The method eth_getBlockByNumber does not exist/is not available', {
            code: 'ErrEndpointCapacityExceeded',
        }),
        true,
    ],
    [
        'the key may not call the method',
        proxyError(-32601, 'The method debug_traceBlockByHash does not exist/is not available', {
            code: 'ErrEndpointUnsupported',
            message: 'remote endpoint does not support requested method',
        }),
        false,
    ],
    [
        'upstream lags the head',
        proxyError(-32603, 'gave up retrying on network-level after 1s: 1 upstream not synced', {
            code: 'ErrUpstreamBlockUnavailable',
        }),
        true,
    ],
    [
        'upstream refused the connection',
        proxyError(-32603, 'Post "": dial tcp 10.0.0.1:443: connect: connection refused', {
            code: 'ErrEndpointTransportFailure',
        }),
        true,
    ],
    [
        'upstream rejected the credentials with an empty body',
        proxyError(
            -32016,
            'cannot parse json-rpc response: "Syntax error no sources available, the input json is empty"',
            {
                code: 'ErrEndpointUnauthorized',
            },
        ),
        false,
    ],
    [
        'upstream says it cannot serve the call at this time',
        proxyError(-32601, 'The method eth_getBlockByNumber does not exist/is not available', {
            code: 'ErrEndpointServerSideException',
            message: 'Unable to complete request at this time.',
            details: {originalCode: -32001},
        }),
        true,
    ],
    [
        'upstream rejects the params with retry advice',
        proxyError(-32603, 'gave up retrying on network-level after 1s: 1 upstream server errors', {
            code: 'ErrEndpointServerSideException',
            message: 'Invalid params; please retry with a smaller block range',
            details: {originalCode: -32602},
        }),
        false,
    ],
    [
        'upstream has pruned the state',
        proxyError(27, 'Unknown state. First available state is 14875359', {
            code: 'ErrEndpointServerSideException',
            message: 'Unknown state. First available state is 14875359',
        }),
        false,
    ],
]

function httpError(status: number, body: unknown): HttpError {
    return new HttpError(new HttpResponse(1, 'http://localhost', status, new Headers() as any, body, false))
}

describe('EvmRpcClient.isConnectionError', () => {
    let client = new EvmRpcClient({url: 'http://localhost:1', log: null})
    let clientRetrying500 = new EvmRpcClient({url: 'http://localhost:1', log: null, retryInternalServerErrors: true})

    it.each(TRANSIENT)('retries %i %s', (code, message) => {
        expect(client.isConnectionError(new RpcError({code, message}))).toBe(true)
    })

    it.each(PERMANENT)('does not retry %i %s', (code, message) => {
        expect(client.isConnectionError(new RpcError({code, message}))).toBe(false)
    })

    it.each(PROXY)('judges a proxy error by its causes: %s', (_, err, retry) => {
        expect(client.isConnectionError(err)).toBe(retry)
    })

    it('retries HTTP 500 whose JSON-RPC body says the failure is temporary', () => {
        let body = {jsonrpc: '2.0', id: 1, error: {code: 19, message: 'Temporary internal error. Please retry'}}
        expect(client.isConnectionError(httpError(500, body))).toBe(true)
    })

    it('retries a batch HTTP 500 only when every error in it is transient, in any order', () => {
        let transient = {id: 1, error: {code: 19, message: 'Temporary internal error. Please retry'}}
        let permanent = {id: 2, error: {code: -32601, message: 'The method x does not exist/is not available'}}
        expect(client.isConnectionError(httpError(500, [transient, permanent]))).toBe(false)
        expect(client.isConnectionError(httpError(500, [permanent, transient]))).toBe(false)
        expect(client.isConnectionError(httpError(500, [transient, {...transient, id: 3}]))).toBe(true)
    })

    it('leaves a bare HTTP 500 to retryInternalServerErrors', () => {
        let err = httpError(500, 'Internal Server Error\n')
        expect(client.isConnectionError(err)).toBe(false)
        expect(clientRetrying500.isConnectionError(err)).toBe(true)
    })
})

const BLOCK = loadBlock('ethereum', 18000000)

describe('Rpc result validation', () => {
    let server: http.Server
    let url: string
    let responses: unknown[]

    beforeEach(async () => {
        responses = []
        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', (chunk) => {
                body += chunk
            })
            req.on('end', () => {
                let {id} = JSON.parse(body)
                let result = responses.length > 1 ? responses.shift() : responses[0]
                res.writeHead(200, {'content-type': 'application/json'})
                res.end(JSON.stringify({jsonrpc: '2.0', id, result}))
            })
        })
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    afterEach(async () => {
        await new Promise<void>((resolve) => server.close(() => resolve()))
    })

    function rpc(retryAttempts: number): Rpc {
        let client = new EvmRpcClient({url, log: null, retryAttempts, retrySchedule: [0]})
        return new Rpc({client})
    }

    it.each([
        ['a proxy error text', "You've been rate limited, please upgrade your plan.\n"],
        [
            'a proxy error page',
            'upstream connect error or disconnect/reset before headers. reset reason: connection termination',
        ],
        ['null from a lagging backend', null],
    ])('retries %s in place of a block', async (_, result) => {
        responses = [result]
        await expect(rpc(0).getLatestBlockhash('latest')).rejects.toBeInstanceOf(RetryError)
    })

    it('still fails on a malformed block', async () => {
        responses = [{...BLOCK, number: 'not a number'}]
        await expect(rpc(0).getLatestBlockhash('latest')).rejects.toBeInstanceOf(DataValidationError)
    })

    it('gets the block once the endpoint recovers', async () => {
        responses = ["You've been rate limited, please upgrade your plan.\n", BLOCK]
        await expect(rpc(1).getLatestBlockhash('latest')).resolves.toEqual({
            number: qty2Int(BLOCK.number),
            hash: BLOCK.hash,
        })
    })
})
