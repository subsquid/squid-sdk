import {wait} from '@subsquid/util-internal'
import assert from 'assert'
import fetch, {FetchError, RequestInit} from 'node-fetch'


interface RpcRequest {
    id: number
    jsonrpc: '2.0'
    method: string
    params?: unknown[]
}


interface RpcResponse {
    id: number
    jsonrpc: '2.0'
    result?: unknown
    error?: RpcErrorInfo
}


interface RpcErrorInfo {
    code: number
    data?: number | string
    message: string
}


export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly body?: string
    ) {
        super(`Got http ${status}`)
    }
}


export class RpcError extends Error {
    constructor(
        public readonly info: RpcErrorInfo,
        public readonly call: RpcCall
    ) {
        super('rpc error')
    }
}


export interface RpcCall {
    method: string
    params?: unknown[]
}


export class HttpRpcClient {
    private ids = 0

    constructor(private url: string) {}

    async call<T>(method: string, params?: unknown[]): Promise<T> {
        let call: RpcRequest = {
            id: this.ids++,
            jsonrpc: '2.0',
            method,
            params
        }

        let res: RpcResponse = await this.post(call)

        if (res.error) {
            throw new RpcError(res.error, {method, params})
        } else {
            return res.result as T
        }
    }

    async batch(calls: RpcCall[]): Promise<any[]> {
        let req: RpcRequest[] = calls.map(call => {
            return {
                id: this.ids++,
                jsonrpc: '2.0',
                ...call
            }
        })

        let response: RpcResponse[] = await this.post(req)

        assert(response.length == req.length)

        let result = new Array<any>(response.length)
        for (let res of response) {
            let idx = res.id - req[0].id
            if (res.error) {
                throw new RpcError(res.error, calls[idx])
            }
            result[idx] = res.result
        }
        return result
    }

    private async post<T>(body: unknown): Promise<T> {
        let init: RequestInit = {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'accept-encoding': 'gzip, br',
                'content-type': 'application/json'
            },
            body: JSON.stringify(body),
            timeout: 30_000
        }
        let backoff = [100, 500, 2000, 5000, 10_000, 20_000]
        let errors = 0
        while (true) {
            let result = await performFetch(this.url, init).catch(err => {
                assert(err instanceof Error)
                return err
            })
            if (errors < backoff.length && isRetryableError(result)) {
                let timeout = backoff[errors]
                errors += 1
                await wait(timeout)
            } else if (result instanceof Error) {
                throw result
            } else {
                return result
            }
        }
    }
}


async function performFetch(url: string, init: RequestInit): Promise<any> {
    let response = await fetch(url, init)
    if (response.ok) return response.json()
    let body = await response.text()
    throw new HttpError(response.status, body)
}


function isRetryableError(err: unknown): err is Error {
    if (err instanceof HttpError) {
        switch(err.status) {
            case 429:
            case 502:
            case 503:
            case 504:
                return true
            default:
                return false
        }
    }
    if (err instanceof FetchError) {
        switch(err.type) {
            case 'body-timeout':
            case 'request-timeout':
                return true
            case 'system':
                return err.message.startsWith('request to')
            default:
                return false
        }
    }
    return false
}
