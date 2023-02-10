import {wait} from '@subsquid/util-internal'
import assert from 'assert'
import {RequestInit} from 'node-fetch'
import {isRetryableError, performFetch} from './fetch'
import {ResilientRpcClient as WsRpcClient, ResilientRpcClientOptions} from '@subsquid/rpc-client/lib/resilient'
import {URL} from 'url'

interface RpcRequest {
    id: number
    jsonrpc: '2.0'
    method: string
    params?: unknown[]
}

interface RpcResponse {
    jsonrpc: '2.0'
    result?: unknown
    error?: RpcErrorInfo
}

interface RpcErrorInfo {
    code: number
    data?: number | string
    message: string
}

export class RpcError extends Error {
    constructor(public readonly info: RpcErrorInfo, public readonly call: RpcCall) {
        super('rpc error')
    }
}

export interface RpcCall {
    method: string
    params?: unknown[]
}

export class HttpRpcClient {
    private ids = 0

    constructor(private options: ResilientRpcClientOptions) {}

    async call<T>(method: string, params?: unknown[]): Promise<T> {
        let call: RpcRequest = {
            id: this.ids++,
            jsonrpc: '2.0',
            method,
            params,
        }

        let res: RpcResponse = await this.post(call)

        if (res.error) {
            throw new RpcError(res.error, {method, params})
        } else {
            return res.result as T
        }
    }

    private async post<T>(body: unknown): Promise<T> {
        let init: RequestInit = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'accept-encoding': 'gzip, br',
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
            timeout: (this.options.timeoutSeconds || 30) * 1000,
        }
        let backoff = [100, 500, 2000, 5000, 10_000, 20_000]
        let errors = 0
        while (true) {
            let result = await performFetch(this.options.url, init).catch((err) => {
                assert(err instanceof Error)
                return err
            })
            if (errors < (this.options.maxRetries ?? Infinity) && isRetryableError(result)) {
                let timeout = backoff[Math.min(errors, backoff.length)]
                errors += 1
                this.options.onRetry?.(result, errors, timeout)
                await wait(timeout)
            } else if (result instanceof Error) {
                throw result
            } else {
                return result
            }
        }
    }
}

export class RpcClient {
    private client: WsRpcClient | HttpRpcClient

    constructor(private options: ResilientRpcClientOptions) {
        switch (new URL(options.url).protocol) {
            case 'http:':
            case 'https:':
                this.client = new HttpRpcClient(options)
                break
            case 'ws:':
            case 'wss:':
                this.client = new WsRpcClient(options)
                break
            default:
                throw new Error('Uтsupported node protocol')
        }
    }

    async call<T = any>(method: string, params?: unknown[]): Promise<T> {
        return this.client.call(method, params)
    }
}
