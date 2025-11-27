import type {AgentProvider} from '@subsquid/http-client'
import {ensureError} from '@subsquid/util-internal'
import assert from 'node:assert'
import * as http from 'node:http'
import * as https from 'node:https'
import type {Writable} from 'node:stream'
import {StringDecoder} from 'node:string_decoder'


export interface UploadOptions {
    method?: 'POST' | 'PUT'
    query?: Record<string, string | number | bigint>
    headers?: Record<string, string | number>
    username?: string
    password?: string
    agent?: AgentProvider
}


export function createUpload<R = any>(url: string, options: UploadOptions = {}): Upload<R> {
    let u = new URL(url)

    if (u.protocol != 'http:' && u.protocol != 'https:') {
        throw new Error(`unsupported protocol - ${u.protocol}`)
    }

    if (options.query) {
        for (let key in options.query) {
            u.searchParams.append(key, ''+options.query[key])
        }
    }

    if (options.username != null) {
        u.username = options.username
    }

    if (options.password != null) {
        u.password = options.password
    }

    let params = {
        agent: options.agent?.getNativeAgent(url),
        method: options.method ?? 'POST',
        headers: {...options.headers},
        hostname: u.hostname,
        port: u.port,
        path: u.pathname
    }

    if (u.searchParams.size > 0) {
        params.path += '?' + u.searchParams.toString()
    }

    if (u.username || u.password) {
        params.headers.authorization = `Basic ${btoa(u.username + ':' + u.password)}`
    }

    let request = u.protocol == 'https:'
        ? https.request
        : http.request

    return new HttpUpload(request(params))
}


export interface Upload<R> {
    readonly input: Writable
    result(): Promise<R>
    abort(): void
    abortOnSignal(signal: AbortSignal): void
}


class HttpUpload<R = any> implements Upload<R> {
    private resultPromise: Promise<R>

    constructor(private req: http.ClientRequest) {
        this.resultPromise = new Promise((resolve, reject) => {
            req.on('error', err => {
                reject(ensureError(err))
            })

            function fail(error: unknown): void {
                let err = ensureError(error)
                reject(err)
                req.destroy(err)
            }

            req.on('response', res => {
                handleResponse(res).then(
                    result => {
                        if (req.writableFinished) {
                            resolve(result)
                        } else {
                            fail(new Error('got response before upload was finished'))
                        }
                    },
                    fail
                )
            })
        })
        this.resultPromise.catch(_ => {})
    }

    abort(): void {
        if (this.req.destroyed) return
        this.req.destroy(new Error('upload was aborted'))
    }

    abortOnSignal(signal: AbortSignal): void {
        if (this.req.destroyed || this.req.closed) return
        if (signal.aborted) return this.abort()

        let abort = () => {
            this.abort()
            cleanup()
        }

        let cleanup = () => {
            signal.removeEventListener('abort', abort)
            this.req.removeListener('close', cleanup)
            this.req.removeListener('error', cleanup)
        }

        signal.addEventListener('abort', abort)
        this.req.on('error', cleanup)
        this.req.on('close', cleanup)
    }

    get input(): Writable {
        return this.req
    }

    result(): Promise<R> {
        return this.resultPromise
    }
}


async function handleResponse(res: http.IncomingMessage): Promise<any> {
    let body = await consumeTextBody(res)
    let result: any

    if (res.headers['content-type']?.match(/^application\/json\b/)) {
        try {
            result = JSON.parse(body)
        } catch(err: any) {
            throw new Error('invalid JSON response: ' + err.message)
        }
    } else {
        result = body
    }

    if (200 <= res.statusCode! && res.statusCode! < 300) {
        return body ? result : undefined
    }

    throw new UploadResponseError(
        res.statusCode!,
        typeof result == 'string' ? result : undefined,
        typeof result == 'string' ? undefined : result
    )
}


async function consumeTextBody(res: http.IncomingMessage): Promise<string> {
    assert(res.headers['content-encoding'] == null, 'Content-Encoding header is not supported')

    let decoder = new StringDecoder('utf-8')
    let body = ''
    let size = 0

    for await (let chunk of res) {
        size += chunk.length
        if (size > 1024 * 1024) {
            throw new Error('Max response size of 1 MB exceeded')
        }
        body += decoder.write(chunk)
    }

    return body + decoder.end()
}


export class UploadResponseError extends Error {
    constructor(
        public status: number,
        public text?: string,
        public json?: any
    ) {
        let msg = `got HTTP ${status}`
        if (text) {
            msg += ' : ' + text
        }
        super(msg)
    }

    get name(): string {
        return 'UploadResponseError'
    }
}
