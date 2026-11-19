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

    it('retries HTTP 500 whose body is not a JSON-RPC answer', () => {
        let err = httpError(500, 'Uncaught exception')
        expect(client.isConnectionError(err)).toBe(true)
        expect(clientRetrying500.isConnectionError(err)).toBe(true)
    })

    it('retries HTTP 500 with a proxy error object, which is not a JSON-RPC answer', () => {
        let err = httpError(500, {error: {message: 'Internal Server Error'}})
        expect(client.isConnectionError(err)).toBe(true)
        expect(client.getRetryKind(err)).toBe('http')
    })

    it('leaves HTTP 500 with a permanent JSON-RPC error to retryInternalServerErrors', () => {
        let err = httpError(500, {jsonrpc: '2.0', id: 1, error: {code: -32000, message: 'execution reverted'}})
        expect(client.isConnectionError(err)).toBe(false)
        expect(clientRetrying500.isConnectionError(err)).toBe(true)
    })
})

describe('EvmRpcClient.getRetryKind', () => {
    let client = new EvmRpcClient({url: 'http://localhost:1', log: null})
    let clientRetrying500 = new EvmRpcClient({url: 'http://localhost:1', log: null, retryInternalServerErrors: true})

    it.each([
        [new RpcError({code: -32429, message: 'Throughput limit 1000 CUs/sec exceeded'}), 'rate_limit'],
        [
            new RpcError({code: -32603, message: 'gave up retrying on network-level after 1s: 1 upstream not synced'}),
            'transient',
        ],
        [new RpcError({code: -32000, message: 'execution timeout'}), 'timeout'],
        [new RetryError('server returned unexpected result: null is not an object'), 'no_result'],
        [
            httpError(500, {
                jsonrpc: '2.0',
                id: 1,
                error: {code: 19, message: 'Temporary internal error. Please retry'},
            }),
            'transient',
        ],
        [httpError(500, {error: {code: 19, message: 'Temporary internal error. Please retry'}}), 'http'],
        [httpError(500, 'Uncaught exception'), 'http'],
        [httpError(503, ''), 'http'],
        [traceError('debug_traceBlockByHash', -32000, 'insufficient funds for gas * price + value'), 'wrong_state'],
    ])('classifies %s as %s', (err, kind) => {
        expect(client.getRetryKind(err)).toBe(kind)
    })

    it('classifies internal errors retried by retryInternalServerErrors as internal', () => {
        expect(clientRetrying500.getRetryKind(new RpcError({code: -32603, message: 'Internal error'}))).toBe('internal')
        expect(
            clientRetrying500.getRetryKind(
                httpError(500, {jsonrpc: '2.0', id: 1, error: {code: -32000, message: 'execution reverted'}}),
            ),
        ).toBe('internal')
        expect(clientRetrying500.getRetryKind(httpError(500, 'Uncaught exception'))).toBe('http')
    })
})

const PRECHECK_FAILURE = 'tracing failed: insufficient funds for gas * price + value: address 0x01 have 0 want 100'

// An error in answer to a call, as RpcClient hands it over.
function traceError(method: string, code: number, message: string, data?: unknown): RpcError {
    return Object.assign(new RpcError({code, message, data}), {rpcMethod: method})
}

// As a proxy passes on the node's -32000.
function proxiedTraceError(method: string, message = PRECHECK_FAILURE): RpcError {
    return traceError(method, -32003, message, {
        code: 'ErrEndpointExecutionException',
        message,
        details: {originalCode: -32000},
    })
}

describe('EvmRpcClient on a pre-check failure while tracing a mined block', () => {
    let client = new EvmRpcClient({url: 'http://localhost:1', log: null})

    it.each([
        'debug_traceBlockByHash',
        'debug_traceBlockByNumber',
        'debug_traceTransaction',
        'trace_block',
        'trace_replayBlockTransactions',
        'trace_replayTransaction',
        'trace_transaction',
    ])('retries %s', (method) => {
        expect(client.isConnectionError(proxiedTraceError(method))).toBe(true)
    })

    it.each([
        [-32000, 'insufficient funds for gas * price + value: address 0x01 have 0 want 100'],
        [-32000, 'nonce too low: address 0x01, tx: 5 state: 6'],
        [-32000, 'nonce too high: address 0x01, tx: 7 state: 6'],
        [-32000, 'intrinsic gas too low: have 0, want 21000'],
        [-32603, 'insufficient funds for gas * price + value'],
        [-32000, 'err: insufficient funds for gas * price + value: address 0x01 have 0 want 100 (supplied gas 21000)'],
        [-32000, 'Insufficient funds for gas * price + value'],
        [1, 'nonce too low'],
    ])('retries %i %s straight from the node', (code, message) => {
        expect(client.isConnectionError(traceError('debug_traceBlockByHash', code, message))).toBe(true)
    })

    it('finds the failure in a cause under a generic proxy message', () => {
        let err = traceError('debug_traceBlockByHash', -32603, 'all upstream attempts failed', {
            code: 'ErrUpstreamsExhausted',
            cause: [{code: 'ErrEndpointExecutionException', message: PRECHECK_FAILURE}],
        })
        expect(client.isConnectionError(err)).toBe(true)
    })

    it('finds the failure in a cause whose own message is generic', () => {
        let err = traceError('trace_block', -32603, 'gave up retrying on network-level after 1s', {
            code: 'ErrFailsafeRetryExceeded',
            cause: {
                code: 'ErrUpstreamsExhausted',
                cause: [
                    {
                        code: 'ErrUpstreamRequest',
                        cause: {code: 'ErrEndpointExecutionException', message: 'nonce too high'},
                    },
                ],
            },
        })
        expect(client.isConnectionError(err)).toBe(true)
    })

    it.each([
        'eth_call',
        'eth_estimateGas',
        'eth_sendRawTransaction',
        'debug_traceCall',
        'trace_call',
        'trace_callMany',
    ])('does not retry it for %s, which runs a new transaction', (method) => {
        expect(client.isConnectionError(proxiedTraceError(method))).toBe(false)
    })

    it('does not retry it when the method is unknown', () => {
        let err = new RpcError({code: -32003, message: PRECHECK_FAILURE, data: {code: 'ErrEndpointExecutionException'}})
        expect(client.isConnectionError(err)).toBe(false)
    })

    it.each([
        'execution reverted',
        'insufficient funds for transfer',
        'out of gas',
        'tracing failed: max fee per gas less than block base fee',
    ])('does not retry other execution errors of a trace: %s', (message) => {
        expect(client.isConnectionError(proxiedTraceError('debug_traceBlockByHash', message))).toBe(false)
    })
})

type Call = {id: number; method: string}
type Reply = {status: number; contentType: string; body: unknown}

const PRECHECK_ERROR = {
    code: -32003,
    message: PRECHECK_FAILURE,
    data: {code: 'ErrEndpointExecutionException', message: PRECHECK_FAILURE},
}

function json(body: unknown, status = 200): Reply {
    return {status, contentType: 'application/json', body}
}

// an error for each call, as the node answers
function perCallErrors(calls: Call | Call[]): Reply {
    let answer = (call: Call) => ({jsonrpc: '2.0', id: call.id, error: PRECHECK_ERROR})
    return json(Array.isArray(calls) ? calls.map(answer) : answer(calls))
}

// one error for the whole batch, as a proxy may answer
function wholeBatchError(): Reply {
    return json({jsonrpc: '2.0', id: null, error: PRECHECK_ERROR})
}

describe('EvmRpcClient through the transport', () => {
    let server: http.Server
    let url: string
    let replies: ((calls: Call | Call[]) => Reply)[]

    beforeEach(async () => {
        replies = []
        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', (chunk) => {
                body += chunk
            })
            req.on('end', () => {
                let calls = JSON.parse(body)
                let answer = (call: Call) => ({jsonrpc: '2.0', id: call.id, result: []})
                let reply = replies.shift()?.(calls) ?? json(Array.isArray(calls) ? calls.map(answer) : answer(calls))
                res.writeHead(reply.status, {'content-type': reply.contentType})
                res.end(typeof reply.body == 'string' ? reply.body : JSON.stringify(reply.body))
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

    function client(retryAttempts = 1): EvmRpcClient {
        return new EvmRpcClient({url, log: null, retryAttempts, retrySchedule: [0]})
    }

    function traceBatch(...methods: string[]) {
        return methods.map((method, i) => ({method, params: [`0x0${i + 1}`, {tracer: 'callTracer'}]}))
    }

    describe('on a pre-check failure', () => {
        it('retries a trace call', async () => {
            replies = [perCallErrors]
            let rpc = client()

            await expect(rpc.call('debug_traceBlockByHash', ['0x01', {tracer: 'callTracer'}])).resolves.toEqual([])
            expect(rpc.getMetrics().retriedErrors).toEqual({wrong_state: 1})
            rpc.close()
        })

        it('retries a batch of trace calls that fail one by one', async () => {
            replies = [perCallErrors]
            let rpc = client()

            await expect(rpc.batchCall(traceBatch('trace_block', 'trace_block'))).resolves.toEqual([[], []])
            expect(rpc.getMetrics().retriedErrors).toEqual({wrong_state: 1})
            rpc.close()
        })

        it('retries a batch of trace calls that fails as a whole', async () => {
            replies = [wholeBatchError]
            let rpc = client()

            let batch = traceBatch('debug_traceBlockByHash', 'debug_traceBlockByHash')
            await expect(rpc.batchCall(batch)).resolves.toEqual([[], []])
            expect(rpc.getMetrics().retriedErrors).toEqual({wrong_state: 1})
            rpc.close()
        })

        it('keeps retrying while the node serves wrong state', async () => {
            replies = [perCallErrors, perCallErrors, perCallErrors]
            let rpc = client(3)

            await expect(rpc.call('debug_traceTransaction', ['0x01'])).resolves.toEqual([])
            expect(rpc.getMetrics().retriedErrors).toEqual({wrong_state: 3})
            rpc.close()
        })

        it('fails once the retries are spent', async () => {
            replies = [perCallErrors, perCallErrors]
            let rpc = client(1)

            await expect(rpc.call('debug_traceTransaction', ['0x01'])).rejects.toBeInstanceOf(RpcError)
            rpc.close()
        })

        it('fails a batch of several methods that fails as a whole', async () => {
            replies = [wholeBatchError]
            let rpc = client()

            let batch = traceBatch('debug_traceBlockByHash', 'eth_getBlockByHash')
            await expect(rpc.batchCall(batch)).rejects.toBeInstanceOf(RpcError)
            expect(rpc.getMetrics().retriedErrors).toEqual({})
            rpc.close()
        })

        it('fails eth_call at once', async () => {
            replies = [perCallErrors]
            let rpc = client()

            await expect(rpc.call('eth_call', [{to: '0x01'}, 'latest'])).rejects.toBeInstanceOf(RpcError)
            expect(rpc.getMetrics().retriedErrors).toEqual({})
            rpc.close()
        })

        it('fails a batch of eth_call that fails as a whole at once', async () => {
            replies = [wholeBatchError]
            let rpc = client()

            await expect(rpc.batchCall(traceBatch('eth_call', 'eth_call'))).rejects.toBeInstanceOf(RpcError)
            expect(rpc.getMetrics().retriedErrors).toEqual({})
            rpc.close()
        })
    })

    describe('on HTTP 500', () => {
        it('retries the bare 500 of a proxy', async () => {
            replies = [() => ({status: 500, contentType: 'text/plain;charset=UTF-8', body: 'Uncaught exception'})]
            let rpc = client()

            await expect(rpc.call('eth_blockNumber')).resolves.toEqual([])
            expect(rpc.getMetrics().retriedErrors).toEqual({http: 1})
            rpc.close()
        })

        it('retries a 500 with a proxy error object', async () => {
            replies = [() => json({error: {message: 'Internal Server Error'}}, 500)]
            let rpc = client()

            await expect(rpc.call('eth_blockNumber')).resolves.toEqual([])
            expect(rpc.getMetrics().retriedErrors).toEqual({http: 1})
            rpc.close()
        })

        it('retries a 500 whose JSON-RPC error is transient', async () => {
            let error = {code: 19, message: 'Temporary internal error. Please retry'}
            replies = [(call) => json({jsonrpc: '2.0', id: (call as Call).id, error}, 500)]
            let rpc = client()

            await expect(rpc.call('eth_blockNumber')).resolves.toEqual([])
            expect(rpc.getMetrics().retriedErrors).toEqual({transient: 1})
            rpc.close()
        })

        it('fails on a 500 whose JSON-RPC error is permanent', async () => {
            let error = {code: -32601, message: 'The method x does not exist/is not available'}
            replies = [(call) => json({jsonrpc: '2.0', id: (call as Call).id, error}, 500)]
            let rpc = client()

            await expect(rpc.call('x')).rejects.toBeInstanceOf(HttpError)
            expect(rpc.getMetrics().retriedErrors).toEqual({})
            rpc.close()
        })
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

    function client(retryAttempts: number): EvmRpcClient {
        return new EvmRpcClient({url, log: null, retryAttempts, retrySchedule: [0]})
    }

    function rpc(retryAttempts: number): Rpc {
        return new Rpc({client: client(retryAttempts)})
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

    it('gets the block once the endpoint recovers and counts the retry', async () => {
        responses = ["You've been rate limited, please upgrade your plan.\n", BLOCK]
        let rpcClient = client(1)
        await expect(new Rpc({client: rpcClient}).getLatestBlockhash('latest')).resolves.toEqual({
            number: qty2Int(BLOCK.number),
            hash: BLOCK.hash,
        })
        expect(rpcClient.getMetrics().retriedErrors).toEqual({no_result: 1})
    })
})
