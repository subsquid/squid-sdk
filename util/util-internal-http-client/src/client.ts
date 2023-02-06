import {createLogger, Logger} from '@subsquid/logger'
import {ensureError, wait} from '@subsquid/util-internal'
import type {Headers, RequestInit, Response} from 'node-fetch'
import {AgentProvider, defaultAgentProvider} from './agent'
import {HttpBody} from './body'
import {nodeFetch} from './request'


export interface HttpClientOptions {
    agent?: AgentProvider
    baseUrl?: string
    headers?: Record<string, string | number | bigint>
    /**
     * Default request timeout in milliseconds.
     *
     * This timeout is only related to individual http requests.
     * Overall request processing time might be much larger due to retries.
     */
    httpTimeout?: number
    retryAttempts?: number
    retrySchedule?: number[]
    log?: Logger | null
}


export interface RequestOptions {
    query?: Record<string, string | number | bigint>
    headers?: HeadersInit
    retryAttempts?: number
    retrySchedule?: number[]
    httpTimeout?: number
    abort?: AbortSignal
}


export interface GraphqlRequestOptions extends RequestOptions {
    variables?: Record<string, any>
    url?: string
    method?: 'GET' | 'POST'
}


interface FetchRequest extends RequestInit {
    url: string
    headers: Headers
    timeout?: number
    signal?: AbortSignal
}


export class HttpClient {
    protected log: Logger | null
    protected headers?: Record<string, string | number | bigint>
    private baseUrl?: string
    private agent: AgentProvider
    private retrySchedule: number[]
    private retryAttempts: number
    private httpTimeout?: number

    constructor(options: HttpClientOptions = {}) {
        this.log = options.log === undefined ? createLogger('sqd:http-client') : options.log
        this.headers = options.headers
        this.setBaseUrl(options.baseUrl)
        this.agent = options.agent || defaultAgentProvider
        this.retrySchedule = options.retrySchedule || [10, 100, 500, 2000, 10000, 20000]
        this.retryAttempts = options.retryAttempts || 0
        this.httpTimeout = options.httpTimeout
    }

    get<T=any>(url: string, options?: RequestOptions): Promise<T> {
        return this.request('GET', url, options).then(res => res.body)
    }

    post<T=any>(url: string, options?: RequestOptions & HttpBody): Promise<T> {
        return this.request('POST', url, options).then(res => res.body)
    }

    async request<T=any>(
        method: string,
        url: string,
        options: RequestOptions & HttpBody = {},
    ): Promise<HttpResponse<T>> {
        let req = await this.prepareRequest(method, url, options)

        let retryAttempts = options.retryAttempts ?? this.retryAttempts
        let retrySchedule = options.retrySchedule ?? this.retrySchedule
        let retries = 0

        while (true) {
            let res: HttpResponse | Error = await this.performRequestWithTimeout(req).catch(ensureError)
            if (res instanceof Error || !res.ok) {
                if (retryAttempts > retries && this.isRetryableError(req, res)) {
                    let pause = retrySchedule.length
                        ? retrySchedule[Math.max(retries, retrySchedule.length - 1)]
                        : 1000
                    retries += 1
                    await wait(pause, req.signal)
                } else if (res instanceof Error) {
                    throw res
                } else {
                    throw new HttpError(res)
                }
            } else {
                return res
            }
        }
    }

    protected async prepareRequest(
        method: string,
        url: string,
        options: RequestOptions & HttpBody
    ): Promise<FetchRequest> {
        await nodeFetch.load()

        let req: FetchRequest = {
            method,
            headers: new nodeFetch.Headers(options.headers),
            url: this.getAbsUrl(url),
            signal: options.abort,
            compress: true,
            timeout: options.httpTimeout ?? this.httpTimeout
        }

        if (options.query) {
            let qs = new URLSearchParams(options.query as any).toString()
            if (req.url.includes('?')) {
                req.url += '&' + qs
            } else {
                req.url += '?' + qs
            }
        }

        req.agent = this.agent.getNativeAgent(req.url)

        if (options.content !== undefined) {
            if (typeof options.content == 'string') {
                req.body = options.content
                if (!req.headers.has('content-type')) {
                    req.headers.set('content-type', 'text/plain')
                }
            } else if (Buffer.isBuffer(options.content)) {
                req.body = options.content
            } else {
                req.body = Buffer.from(options.content.buffer, options.content.byteOffset, options.content.byteLength)
            }
        }

        if (options.json !== undefined) {
            req.body = JSON.stringify(options.json)
            if (!req.headers.has('content-type')) {
                req.headers.set('content-type', 'application/json')
            }
        }

        for (let name in this.headers) {
            if (!req.headers.has(name)) {
                req.headers.set(name, ''+this.headers[name])
            }
        }

        return req
    }

    private async performRequestWithTimeout(req: FetchRequest): Promise<HttpResponse> {
        if (!req.timeout) return this.performRequest(req)

        let ac = new AbortController()

        function abort() {
            ac.abort()
        }

        req.signal?.addEventListener('abort', abort)

        let timer: any | null = setTimeout(() => {
            timer = null
            abort()
        }, req.timeout)

        try {
            return await this.performRequest({...req, signal: ac.signal})
        } catch(err: any) {
            if (timer == null) {
                throw new HttpTimeoutError(req.timeout)
            } else {
                throw err
            }
        } finally {
            if (timer != null) {
                clearTimeout(timer)
            }
            req.signal?.removeEventListener('abort', abort)
        }
    }

    protected async performRequest(req: FetchRequest): Promise<HttpResponse> {
        let res = await nodeFetch.request(req.url, req)
        let body = await this.handleResponseBody(req, res)
        return new HttpResponse(res.url, res.status, res.headers, body)
    }

    protected async handleResponseBody(req: FetchRequest, res: Response): Promise<any> {
        let contentType = (res.headers.get('content-type') || '').split(';')[0]

        if (contentType == 'application/json') {
            return res.json()
        }

        if (contentType.startsWith('text/')) {
            return res.text()
        }

        let bytes = await res.buffer()
        if (bytes.length == 0) return undefined
        return bytes
    }

    protected isRetryableError(req: FetchRequest, error: HttpResponse | Error): boolean {
        if (isHttpConnectionError(error)) return true
        if (error instanceof HttpTimeoutError) return true
        if (error instanceof HttpError) {
            switch(error.response.status) {
                case 429:
                case 502:
                case 503:
                case 504:
                    return true
                default:
                    return false
            }
        }
        return false
    }

    getAbsUrl(url: string): string {
        if (!this.baseUrl) return url
        if (url.includes('://')) return url
        if (url[0] == '/') return this.baseUrl + url
        return this.baseUrl + '/' + url
    }

    private setBaseUrl(url?: string): void {
        if (url) {
            let u = new URL(url)
            u.hash = ''
            u.search = ''
            url = u.toString()
            if (url.endsWith('/')) {
                url = url.slice(0, url.length - 1)
            }
            this.baseUrl = url
        } else {
            this.baseUrl = undefined
        }
    }

    async graphqlRequest<T=any>(gql: string, options: GraphqlRequestOptions = {}): Promise<T> {
        let {method = 'POST', url = '/', variables, ...reqOptions} = options
        let req: RequestOptions & {json?: any} = reqOptions
        if (method == 'GET') {
            req.query = {
                ...req.query,
                query: gql,
            }
            if (variables) {
                req.query.variables = JSON.stringify(variables)
            }
        } else {
            req.json = {
                query: gql,
                variables
            }
        }
        let res = await this.request<{data: T, errors?: GraphqlMessage[]}>(method, url, req)
        if (res.body.errors?.length) {
            throw new GraphqlError(res.body.errors)
        } else {
            return res.body.data
        }
    }
}


export class HttpResponse<T=any> {
    constructor(
        public readonly url: string,
        public readonly status: number,
        public readonly headers: Headers,
        public readonly body: T
    ) {
    }

    get ok(): boolean {
        return this.status >= 200 && this.status < 300
    }

    assert(): void {
        if (this.ok) return
        throw new HttpError(this)
    }

    toJSON() {
        return {
            status: this.status,
            headers: Array.from(this.headers),
            body: this.body,
            url: this.url
        }
    }
}


export class HttpError extends Error {
    constructor(public readonly response: HttpResponse) {
        super(`Got ${response.status} from ${response.url}`)
    }

    get name(): string {
        return 'HttpError'
    }
}


export class HttpTimeoutError extends Error {
    constructor(ms: number) {
        super(`request timed out after ${ms} ms`)
    }

    get name(): string {
        return 'HttpTimeoutError'
    }
}


export interface GraphqlMessage {
    message: string
    path?: (string | number)[]
}


export class GraphqlError extends Error {
    constructor(public readonly messages: GraphqlMessage[]) {
        super(`GraphQL error: ${messages[0].message}`)
    }

    get name(): string {
        return 'GraphqlError'
    }
}


export function isHttpConnectionError(err: unknown): boolean {
    return err instanceof nodeFetch.FetchError
        && err.type == 'system'
        && err.message.startsWith('request to')
}
