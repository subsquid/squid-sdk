import assert from 'assert'
import * as http from 'http'
import {AddressInfo} from 'net'
import {after, before, describe, it} from 'node:test'
import {
    FetchRequest,
    GraphqlError,
    HttpClient,
    HttpError,
    HttpResponse,
    HttpTimeoutError,
    asRetryAfterPause,
    isHttpConnectionError,
} from './client'


type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>


function createServer() {
    let _handler: Handler = (req, res) => {
        res.writeHead(404)
        res.end()
    }

    const httpServer = http.createServer((req, res) => {
        Promise.resolve(_handler(req, res)).catch(err => {
            if (!res.headersSent) {
                res.writeHead(500)
                res.end(String(err))
            }
        })
    })

    return {
        start(): Promise<void> {
            return new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve))
        },
        close(): Promise<void> {
            return new Promise((resolve, reject) =>
                httpServer.close(err => err ? reject(err) : resolve())
            )
        },
        set handler(fn: Handler) {
            _handler = fn
        },
        get url(): string {
            return `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`
        },
    }
}


function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on('data', chunk => chunks.push(Buffer.from(chunk)))
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        req.on('error', reject)
    })
}


class TestHttpClient extends HttpClient {
    readonly capturedPauses: number[] = []

    protected override beforeRetryPause(_req: FetchRequest, _reason: Error | HttpResponse, pause: number): void {
        this.capturedPauses.push(pause)
    }
}


describe('getAbsUrl', () => {
    it('returns url unchanged when no baseUrl configured', () => {
        const client = new HttpClient()
        assert.strictEqual(client.getAbsUrl('http://example.com/foo'), 'http://example.com/foo')
    })

    it('returns absolute url unchanged even when baseUrl is set', () => {
        const client = new HttpClient({baseUrl: 'http://base.com'})
        assert.strictEqual(client.getAbsUrl('http://other.com/foo'), 'http://other.com/foo')
    })

    it('returns baseUrl when path is "/"', () => {
        const client = new HttpClient({baseUrl: 'http://base.com'})
        assert.strictEqual(client.getAbsUrl('/'), 'http://base.com')
    })

    it('joins path with leading slash to baseUrl', () => {
        const client = new HttpClient({baseUrl: 'http://base.com'})
        assert.strictEqual(client.getAbsUrl('/foo'), 'http://base.com/foo')
    })

    it('joins relative path to baseUrl with "/" separator', () => {
        const client = new HttpClient({baseUrl: 'http://base.com'})
        assert.strictEqual(client.getAbsUrl('foo'), 'http://base.com/foo')
    })

    it('strips trailing slash from baseUrl', () => {
        const client = new HttpClient({baseUrl: 'http://base.com/'})
        assert.strictEqual(client.getAbsUrl('foo'), 'http://base.com/foo')
    })

    it('strips query string and hash from baseUrl', () => {
        const client = new HttpClient({baseUrl: 'http://base.com/api?x=1#h'})
        assert.strictEqual(client.getAbsUrl('bar'), 'http://base.com/api/bar')
    })
})


describe('asRetryAfterPause', () => {
    function makeResponse(status: number, headers: Record<string, string> = {}): HttpResponse {
        const h = new Headers(Object.entries(headers)) as any
        return new HttpResponse(0, 'http://example.com', status, h, null, false)
    }

    it('returns undefined when no retry-after header present', () => {
        assert.strictEqual(asRetryAfterPause(makeResponse(429)), undefined)
    })

    it('converts numeric retry-after from seconds to milliseconds', () => {
        assert.strictEqual(asRetryAfterPause(makeResponse(429, {'retry-after': '5'})), 5000)
    })

    it('handles zero retry-after value', () => {
        assert.strictEqual(asRetryAfterPause(makeResponse(429, {'retry-after': '0'})), 0)
    })

    it('parses HTTP date retry-after', () => {
        const future = new Date(Date.now() + 10_000)
        const pause = asRetryAfterPause(makeResponse(429, {'retry-after': future.toUTCString()}))
        assert.ok(
            pause !== undefined && pause > 0 && pause <= 10_000,
            `Expected pause between 0 and 10000 ms, got ${pause}`
        )
    })

    it('returns undefined for a plain Error', () => {
        assert.strictEqual(asRetryAfterPause(new Error('network error')), undefined)
    })

    it('unwraps HttpError and reads retry-after from its response', () => {
        const response = makeResponse(429, {'retry-after': '3'})
        assert.strictEqual(asRetryAfterPause(new HttpError(response)), 3000)
    })
})


describe('isRetryableError', () => {
    const client = new HttpClient()

    function makeResponse(status: number, headers: Record<string, string> = {}): HttpResponse {
        const h = new Headers(Object.entries(headers)) as any
        return new HttpResponse(0, 'http://example.com', status, h, null, false)
    }

    const retryableStatuses = [429, 502, 503, 504, 521, 522, 523, 524]
    const nonRetryableStatuses = [200, 400, 401, 403, 404, 500, 501]

    for (const status of retryableStatuses) {
        it(`returns true for status ${status}`, () => {
            assert.strictEqual(client.isRetryableError(makeResponse(status)), true)
        })
    }

    for (const status of nonRetryableStatuses) {
        it(`returns false for status ${status}`, () => {
            assert.strictEqual(client.isRetryableError(makeResponse(status)), false)
        })
    }

    it('returns true when retry-after header is present (any status)', () => {
        assert.strictEqual(client.isRetryableError(makeResponse(400, {'retry-after': '1'})), true)
    })

    it('returns true for HttpTimeoutError', () => {
        assert.strictEqual(client.isRetryableError(new HttpTimeoutError(1000)), true)
    })

    it('returns false for a generic Error', () => {
        assert.strictEqual(client.isRetryableError(new Error('oops')), false)
    })
})


describe('HttpResponse', () => {
    function make(status: number): HttpResponse {
        return new HttpResponse(0, 'http://x', status, new Headers() as any, null, false)
    }

    it('ok is true for 2xx status codes', () => {
        for (const status of [200, 201, 204, 299]) {
            assert.ok(make(status).ok, `Expected ok for ${status}`)
        }
    })

    it('ok is false for non-2xx status codes', () => {
        for (const status of [100, 301, 400, 404, 500, 503]) {
            assert.ok(!make(status).ok, `Expected not ok for ${status}`)
        }
    })

    it('assert() throws HttpError for non-ok response', () => {
        assert.throws(() => make(404).assert(), HttpError)
        assert.throws(() => make(500).assert(), HttpError)
    })

    it('assert() does not throw for ok response', () => {
        assert.doesNotThrow(() => make(200).assert())
        assert.doesNotThrow(() => make(201).assert())
    })

    it('toJSON() excludes body when stream is true', () => {
        const res = new HttpResponse(1, 'http://x', 200, new Headers() as any, {data: 1}, true)
        assert.strictEqual(res.toJSON().body, undefined)
    })

    it('toJSON() includes body when stream is false', () => {
        const res = new HttpResponse(1, 'http://x', 200, new Headers() as any, {data: 1}, false)
        assert.deepStrictEqual(res.toJSON().body, {data: 1})
    })
})


describe('HttpClient integration', () => {
    const server = createServer()

    before(() => server.start())
    after(() => server.close())

    describe('request method and path', () => {
        it('GET sends correct method and path', async () => {
            let method = '', path = ''
            server.handler = (req, res) => {
                method = req.method!
                path = req.url!
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.get('/foo/bar')
            assert.strictEqual(method, 'GET')
            assert.strictEqual(path, '/foo/bar')
        })

        it('POST sends correct method', async () => {
            let method = ''
            server.handler = (req, res) => {
                method = req.method!
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.post('/')
            assert.strictEqual(method, 'POST')
        })

        it('request() supports arbitrary HTTP methods', async () => {
            let method = ''
            server.handler = (req, res) => {
                method = req.method!
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.request('PATCH', '/')
            assert.strictEqual(method, 'PATCH')
        })
    })

    describe('request body', () => {
        it('sends JSON body with application/json content-type', async () => {
            let body = '', contentType = ''
            server.handler = async (req, res) => {
                body = await readBody(req)
                contentType = req.headers['content-type'] ?? ''
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.post('/', {json: {key: 'value', num: 1}})
            assert.strictEqual(contentType, 'application/json')
            assert.deepStrictEqual(JSON.parse(body), {key: 'value', num: 1})
        })

        it('sends string content with text/plain content-type', async () => {
            let body = '', contentType = ''
            server.handler = async (req, res) => {
                body = await readBody(req)
                contentType = req.headers['content-type'] ?? ''
                res.writeHead(200, {'content-type': 'text/plain'})
                res.end('ok')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.post('/', {content: 'hello world'})
            assert.strictEqual(contentType, 'text/plain')
            assert.strictEqual(body, 'hello world')
        })

        it('uses explicit content-type header when provided alongside string content', async () => {
            let contentType = ''
            server.handler = async (req, res) => {
                contentType = req.headers['content-type'] ?? ''
                await readBody(req)
                res.writeHead(200, {'content-type': 'text/plain'})
                res.end('ok')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.post('/', {content: 'a,b,c', headers: {'content-type': 'text/csv'}})
            assert.strictEqual(contentType, 'text/csv')
        })

        it('sends binary Uint8Array content', async () => {
            const chunks: Buffer[] = []
            server.handler = async (req, res) => {
                await new Promise<void>((resolve, reject) => {
                    req.on('data', chunk => chunks.push(Buffer.from(chunk)))
                    req.on('end', resolve)
                    req.on('error', reject)
                })
                res.writeHead(200, {'content-type': 'text/plain'})
                res.end('ok')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const data = new Uint8Array([1, 2, 3, 4, 5])
            await client.post('/', {content: data})
            assert.deepStrictEqual(Buffer.concat(chunks), Buffer.from(data))
        })

        it('sends no body for request without content or json', async () => {
            let body = ''
            server.handler = async (req, res) => {
                body = await readBody(req)
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.get('/')
            assert.strictEqual(body, '')
        })
    })

    describe('request headers', () => {
        it('sends client-level default headers on every request', async () => {
            let headers: http.IncomingHttpHeaders = {}
            server.handler = (req, res) => {
                headers = req.headers
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({
                baseUrl: server.url,
                headers: {'x-custom': 'default-value'},
                log: null,
            })
            await client.get('/')
            assert.strictEqual(headers['x-custom'], 'default-value')
        })

        it('per-request headers override client-level default headers', async () => {
            let headers: http.IncomingHttpHeaders = {}
            server.handler = (req, res) => {
                headers = req.headers
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({
                baseUrl: server.url,
                headers: {'x-api-key': 'default'},
                log: null,
            })
            await client.get('/', {headers: {'x-api-key': 'override'}})
            assert.strictEqual(headers['x-api-key'], 'override')
        })

        it('converts numeric default header values to strings', async () => {
            let headers: http.IncomingHttpHeaders = {}
            server.handler = (req, res) => {
                headers = req.headers
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({
                baseUrl: server.url,
                headers: {'x-version': 42},
                log: null,
            })
            await client.get('/')
            assert.strictEqual(headers['x-version'], '42')
        })

    })

    describe('query parameters', () => {
        it('appends query parameters to the URL', async () => {
            let url = ''
            server.handler = (req, res) => {
                url = req.url!
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.get('/test', {query: {foo: 'bar', count: '10'}})
            const parsed = new URL(url, 'http://x')
            assert.strictEqual(parsed.searchParams.get('foo'), 'bar')
            assert.strictEqual(parsed.searchParams.get('count'), '10')
        })

        it('merges query params with existing query string', async () => {
            let url = ''
            server.handler = (req, res) => {
                url = req.url!
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.get('/test?existing=1', {query: {added: 'yes'}})
            const parsed = new URL(url, 'http://x')
            assert.strictEqual(parsed.searchParams.get('existing'), '1')
            assert.strictEqual(parsed.searchParams.get('added'), 'yes')
        })
    })

    describe('basic auth', () => {
        it('extracts credentials from URL into Authorization header', async () => {
            let authHeader = ''
            let receivedPath = ''
            server.handler = (req, res) => {
                authHeader = req.headers['authorization'] ?? ''
                receivedPath = req.url!
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({log: null})
            const {host} = new URL(server.url)
            await client.get(`http://alice:secret@${host}/secure`)
            assert.ok(authHeader.startsWith('Basic '), `Expected Basic auth header, got: ${authHeader}`)
            const decoded = Buffer.from(authHeader.slice(6), 'base64').toString()
            assert.strictEqual(decoded, 'alice:secret')
            assert.strictEqual(receivedPath, '/secure')
        })

        it('does not add Authorization header when URL has no credentials', async () => {
            let authHeader: string | undefined
            server.handler = (req, res) => {
                authHeader = req.headers['authorization']
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            await client.get('/public')
            assert.strictEqual(authHeader, undefined)
        })
    })

    describe('response body parsing', () => {
        it('parses application/json response', async () => {
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'application/json'})
                res.end(JSON.stringify({answer: 42}))
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            assert.deepStrictEqual(await client.get('/'), {answer: 42})
        })

        it('returns string for text/plain response', async () => {
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'text/plain'})
                res.end('plain text response')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            assert.strictEqual(await client.get('/'), 'plain text response')
        })

        it('returns string for text/html response', async () => {
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'text/html; charset=utf-8'})
                res.end('<html>test</html>')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            assert.strictEqual(await client.get('/'), '<html>test</html>')
        })

        it('returns Buffer for binary response', async () => {
            const data = Buffer.from([0x01, 0x02, 0x03, 0xff])
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'application/octet-stream'})
                res.end(data)
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const result = await client.get<Buffer>('/')
            assert.ok(Buffer.isBuffer(result), 'Expected Buffer')
            assert.deepStrictEqual(result, data)
        })

        it('returns undefined for empty binary response', async () => {
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'application/octet-stream'})
                res.end()
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const response = await client.request('GET', '/')
            assert.strictEqual(response.body, undefined)
        })
    })

    describe('stream responses', () => {
        it('returns stream=true with body as ReadableStream for ok response when stream option is set', async () => {
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'application/octet-stream'})
                res.end('streamed-content')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const res = await client.request('GET', '/', {stream: true})
            assert.strictEqual(res.stream, true)
            assert.ok(res.body != null, 'Expected non-null body for stream response')

            const chunks: Buffer[] = []
            for await (const chunk of res.body as AsyncIterable<Uint8Array>) {
                chunks.push(Buffer.from(chunk))
            }
            assert.strictEqual(Buffer.concat(chunks).toString('utf8'), 'streamed-content')
        })

        it('falls back to buffered body when stream option is set but response is not ok', async () => {
            server.handler = (req, res) => {
                res.writeHead(503, {'content-type': 'text/plain'})
                res.end('service unavailable')
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 0,
            })
            const err = await client.request('GET', '/', {stream: true}).catch(e => e)
            assert.ok(err instanceof HttpError, `Expected HttpError, got ${err}`)
            assert.strictEqual(err.response.status, 503)
            assert.strictEqual(err.response.stream, false)
            assert.strictEqual(err.response.body, 'service unavailable')
        })
    })

    describe('error handling', () => {
        it('throws HttpError for 4xx response', async () => {
            server.handler = (req, res) => {
                res.writeHead(404)
                res.end()
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const err = await client.get('/missing').catch(e => e)
            assert.ok(err instanceof HttpError, `Expected HttpError, got ${err}`)
            assert.strictEqual(err.response.status, 404)
        })

        it('HttpError message contains status and URL', async () => {
            server.handler = (req, res) => {
                res.writeHead(403)
                res.end()
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const err = await client.get('/secret').catch(e => e)
            assert.ok(err instanceof HttpError)
            assert.ok(err.message.includes('403'), `Expected message to include status 403: ${err.message}`)
            assert.ok(
                err.message.includes('127.0.0.1') || err.message.includes('/secret'),
                `Expected message to include the request URL: ${err.message}`
            )
        })

        it('HttpError carries the response object', async () => {
            server.handler = (req, res) => {
                res.writeHead(422, {'content-type': 'application/json'})
                res.end(JSON.stringify({error: 'invalid'}))
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const err = await client.get('/').catch(e => e)
            assert.ok(err instanceof HttpError)
            assert.deepStrictEqual(err.response.body, {error: 'invalid'})
            assert.ok(err.response.url.length > 0)
        })

        it('HttpError.name is "HttpError"', async () => {
            server.handler = (req, res) => { res.writeHead(400); res.end() }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const err = await client.get('/').catch(e => e)
            assert.ok(err instanceof HttpError)
            assert.strictEqual(err.name, 'HttpError')
        })

        it('HttpTimeoutError.name is "HttpTimeoutError"', () => {
            assert.strictEqual(new HttpTimeoutError(100).name, 'HttpTimeoutError')
        })
    })

    describe('retry behavior', () => {
        it('retries on 503 and succeeds on the next attempt', async () => {
            let callCount = 0
            server.handler = (req, res) => {
                callCount++
                if (callCount < 3) {
                    res.writeHead(503)
                    res.end()
                } else {
                    res.writeHead(200, {'content-type': 'application/json'})
                    res.end('{"ok":true}')
                }
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 3,
                retrySchedule: [0, 0, 0],
            })
            const result = await client.get('/')
            assert.deepStrictEqual(result, {ok: true})
            assert.strictEqual(callCount, 3)
        })

        it('throws HttpError after exhausting all retry attempts', async () => {
            let callCount = 0
            server.handler = (req, res) => {
                callCount++
                res.writeHead(503)
                res.end()
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 2,
                retrySchedule: [0, 0],
            })
            const err = await client.get('/').catch(e => e)
            assert.ok(err instanceof HttpError)
            assert.strictEqual(err.response.status, 503)
            assert.strictEqual(callCount, 3) // 1 initial + 2 retries
        })

        it('does not retry on non-retryable status (404)', async () => {
            let callCount = 0
            server.handler = (req, res) => {
                callCount++
                res.writeHead(404)
                res.end()
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 3,
                retrySchedule: [0, 0, 0],
            })
            await client.get('/').catch(() => {})
            assert.strictEqual(callCount, 1)
        })

        it('per-request retryAttempts overrides client-level setting', async () => {
            let callCount = 0
            server.handler = (req, res) => {
                callCount++
                res.writeHead(503)
                res.end()
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 10,
                retrySchedule: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            })
            await client.get('/', {retryAttempts: 1, retrySchedule: [0]}).catch(() => {})
            assert.strictEqual(callCount, 2) // 1 initial + 1 per-request retry
        })

        it('per-request retrySchedule overrides client-level schedule', async () => {
            let callCount = 0
            server.handler = (req, res) => {
                callCount++
                res.writeHead(503)
                res.end()
            }
            const client = new TestHttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 5,
                retrySchedule: [1000, 1000, 1000, 1000, 1000],
            })
            await client.get('/', {retryAttempts: 2, retrySchedule: [0, 0]}).catch(() => {})
            assert.strictEqual(callCount, 3) // 1 initial + 2 per-request retries
            assert.deepStrictEqual(
                client.capturedPauses, [0, 0],
                'Expected pauses from per-request schedule [0,0], not client-level [1000,...]'
            )
        })

        it('retries on 502 (bad gateway)', async () => {
            let callCount = 0
            server.handler = (req, res) => {
                callCount++
                if (callCount === 1) {
                    res.writeHead(502)
                    res.end()
                } else {
                    res.writeHead(200, {'content-type': 'application/json'})
                    res.end('null')
                }
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 1,
                retrySchedule: [0],
            })
            await client.get('/')
            assert.strictEqual(callCount, 2)
        })

        it('retries on 429 and uses retry-after header as pause', async () => {
            let callCount = 0
            server.handler = (req, res) => {
                callCount++
                if (callCount === 1) {
                    // retry-after: 0 seconds → 0 ms pause from header
                    res.writeHead(429, {'retry-after': '0'})
                    res.end()
                } else {
                    res.writeHead(200, {'content-type': 'application/json'})
                    res.end('null')
                }
            }
            // retrySchedule has a large value (9999 ms) that must NOT be used when the
            // retry-after header is present — header-driven pause takes precedence.
            const client = new TestHttpClient({
                baseUrl: server.url,
                log: null,
                retryAttempts: 1,
                retrySchedule: [9999],
            })
            await client.get('/')
            assert.strictEqual(callCount, 2)
            assert.deepStrictEqual(
                client.capturedPauses, [0],
                'Expected retry-after header (0 ms) to override the schedule (9999 ms)'
            )
        })
    })

    describe('timeout', () => {
        it('throws HttpTimeoutError when request exceeds httpTimeout', async () => {
            server.handler = async (req, res) => {
                await new Promise(resolve => setTimeout(resolve, 500))
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                httpTimeout: 50,
                retryAttempts: 0,
            })
            const err = await client.get('/slow').catch(e => e)
            assert.ok(err instanceof HttpTimeoutError, `Expected HttpTimeoutError, got ${err?.constructor?.name}: ${err}`)
            assert.strictEqual(err.ms, 50)
        })

        it('per-request httpTimeout overrides client-level setting', async () => {
            server.handler = async (req, res) => {
                await new Promise(resolve => setTimeout(resolve, 200))
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                httpTimeout: 5000,
                retryAttempts: 0,
            })
            const err = await client.get('/slow', {httpTimeout: 50}).catch(e => e)
            assert.ok(err instanceof HttpTimeoutError)
            assert.strictEqual(err.ms, 50)
        })

        it('no timeout when httpTimeout is 0', async () => {
            server.handler = async (req, res) => {
                await new Promise(resolve => setTimeout(resolve, 50))
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('{"done":true}')
            }
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                httpTimeout: 0,
            })
            const result = await client.get('/')
            assert.deepStrictEqual(result, {done: true})
        })
    })

    describe('abort signal', () => {
        it('aborts in-flight request when signal fires', async () => {
            server.handler = async (req, res) => {
                await new Promise(resolve => setTimeout(resolve, 500))
                if (!res.headersSent) {
                    res.writeHead(200, {'content-type': 'application/json'})
                    res.end('null')
                }
            }
            const ac = new AbortController()
            const client = new HttpClient({
                baseUrl: server.url,
                log: null,
                httpTimeout: 5000,
                retryAttempts: 0,
            })
            setTimeout(() => ac.abort(), 30)
            const err = await client.get('/slow', {abort: ac.signal}).catch(e => e)
            assert.ok(err instanceof Error)
            assert.ok(!(err instanceof HttpTimeoutError), 'Expected abort error, not timeout')
            assert.strictEqual(err.name, 'AbortError', `Expected AbortError from the provided signal, got ${err.name}: ${err.message}`)
        })
    })

    describe('request() returns HttpResponse', () => {
        it('returns HttpResponse with requestId, status, url, headers, body', async () => {
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'application/json', 'x-foo': 'bar'})
                res.end('{"value":1}')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const res = await client.request('GET', '/')
            assert.strictEqual(typeof res.requestId, 'number')
            assert.strictEqual(res.status, 200)
            assert.ok(res.url.includes('127.0.0.1'))
            assert.deepStrictEqual(res.body, {value: 1})
            assert.strictEqual(res.headers.get('x-foo'), 'bar')
            assert.strictEqual(res.stream, false)
        })

        it('increments requestId for successive requests', async () => {
            server.handler = (req, res) => {
                res.writeHead(200, {'content-type': 'application/json'})
                res.end('null')
            }
            const client = new HttpClient({baseUrl: server.url, log: null})
            const r1 = await client.request('GET', '/')
            const r2 = await client.request('GET', '/')
            assert.strictEqual(r2.requestId, r1.requestId + 1)
        })
    })
})


describe('isHttpConnectionError', () => {
    function makeConnectionError(code: string): TypeError {
        const err = new TypeError('fetch failed')
        ;(err as any).cause = {code}
        return err
    }

    const retryableCodes = [
        'ECONNREFUSED',
        'ECONNRESET',
        'ENOTFOUND',
        'EPIPE',
        'ETIMEDOUT',
        'ERR_STREAM_PREMATURE_CLOSE',
        'UND_ERR_CONNECT_TIMEOUT',
        'UND_ERR_SOCKET',
    ]

    for (const code of retryableCodes) {
        it(`returns true for cause.code ${code}`, () => {
            assert.strictEqual(isHttpConnectionError(makeConnectionError(code)), true)
        })
    }

    it('returns false for unknown cause.code', () => {
        assert.strictEqual(isHttpConnectionError(makeConnectionError('EUNKNOWN')), false)
    })

    it('returns false for TypeError without cause', () => {
        assert.strictEqual(isHttpConnectionError(new TypeError('no cause')), false)
    })

    it('returns false for TypeError with non-object cause', () => {
        const err = new TypeError('bad')
        ;(err as any).cause = 'ECONNREFUSED'
        assert.strictEqual(isHttpConnectionError(err), false)
    })

    it('returns false for a plain Error (not TypeError)', () => {
        const err = new Error('conn error') as any
        err.cause = {code: 'ECONNREFUSED'}
        assert.strictEqual(isHttpConnectionError(err), false)
    })

    it('returns false for non-Error values', () => {
        assert.strictEqual(isHttpConnectionError('ECONNREFUSED'), false)
        assert.strictEqual(isHttpConnectionError(null), false)
        assert.strictEqual(isHttpConnectionError({code: 'ECONNREFUSED'}), false)
    })
})


describe('graphqlRequest', () => {
    const server = createServer()

    before(() => server.start())
    after(() => server.close())

    it('sends POST with query and returns data field', async () => {
        let body = ''
        server.handler = async (req, res) => {
            body = await readBody(req)
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify({data: {result: 'success'}}))
        }
        const client = new HttpClient({baseUrl: server.url, log: null})
        const result = await client.graphqlRequest('{ test }')
        const parsed = JSON.parse(body)
        assert.strictEqual(parsed.query, '{ test }')
        assert.deepStrictEqual(result, {result: 'success'})
    })

    it('includes variables in POST body', async () => {
        let body = ''
        server.handler = async (req, res) => {
            body = await readBody(req)
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify({data: {}}))
        }
        const client = new HttpClient({baseUrl: server.url, log: null})
        await client.graphqlRequest('query Foo($id: ID!) { foo(id: $id) }', {
            variables: {id: '42'},
        })
        assert.deepStrictEqual(JSON.parse(body).variables, {id: '42'})
    })

    it('sends GET request with query in URL when method is GET', async () => {
        let method = '', url = ''
        server.handler = (req, res) => {
            method = req.method!
            url = req.url!
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify({data: {value: 1}}))
        }
        const client = new HttpClient({baseUrl: server.url, log: null})
        await client.graphqlRequest('{ test }', {method: 'GET'})
        assert.strictEqual(method, 'GET')
        const parsed = new URL(url, 'http://x')
        assert.strictEqual(parsed.searchParams.get('query'), '{ test }')
    })

    it('includes variables as JSON string in GET URL', async () => {
        let url = ''
        server.handler = (req, res) => {
            url = req.url!
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify({data: {}}))
        }
        const client = new HttpClient({baseUrl: server.url, log: null})
        await client.graphqlRequest('{ test }', {method: 'GET', variables: {id: '5'}})
        const parsed = new URL(url, 'http://x')
        assert.deepStrictEqual(JSON.parse(parsed.searchParams.get('variables')!), {id: '5'})
    })

    it('uses custom url option for request path', async () => {
        let receivedPath = ''
        server.handler = (req, res) => {
            receivedPath = req.url!
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify({data: {}}))
        }
        const client = new HttpClient({baseUrl: server.url, log: null})
        await client.graphqlRequest('{ test }', {url: '/graphql'})
        assert.ok(receivedPath.startsWith('/graphql'), `Expected /graphql, got ${receivedPath}`)
    })

    it('throws GraphqlError when response contains errors array', async () => {
        server.handler = (req, res) => {
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify({
                data: null,
                errors: [{message: 'Field not found', path: ['user', 'id']}],
            }))
        }
        const client = new HttpClient({baseUrl: server.url, log: null})
        const err = await client.graphqlRequest('{ user { id } }').catch(e => e)
        assert.ok(err instanceof GraphqlError, `Expected GraphqlError, got ${err}`)
        assert.strictEqual(err.messages[0].message, 'Field not found')
        assert.deepStrictEqual(err.messages[0].path, ['user', 'id'])
    })

    it('GraphqlError.name is "GraphqlError"', async () => {
        server.handler = (req, res) => {
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify({data: null, errors: [{message: 'oops'}]}))
        }
        const client = new HttpClient({baseUrl: server.url, log: null})
        const err = await client.graphqlRequest('{ test }').catch(e => e)
        assert.ok(err instanceof GraphqlError)
        assert.strictEqual(err.name, 'GraphqlError')
    })
})
