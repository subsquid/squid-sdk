import {HttpError, HttpTimeoutError, isHttpConnectionError} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {addErrorContext, last, splitParallelWork, wait} from '@subsquid/util-internal'
import {Heap} from '@subsquid/util-internal-binary-heap'
import assert from 'assert'
import {RetryError, RpcConnectionError, RpcError} from './errors'
import {Connection, RpcRequest, RpcResponse} from './interfaces'
import {RateMeter} from './rate'
import {HttpConnection} from './transport/http'
import {WsConnection} from './transport/ws'


export interface RpcClientOptions {
    url: string
    maxBatchCallSize?: number
    capacity?: number
    requestTimeout?: number
    rateLimit?: number
    retryAttempts?: number
    retrySchedule?: number[]
    log?: Logger | null
}


export interface CallOptions<R=any> {
    priority?: number
    retryAttempts?: number
    timeout?: number
    /**
     * Result validator/transformer
     *
     * This option is mainly a way to utilize built-in retry machinery by throwing {@link RetryError}.
     * Otherwise, `client.call(...).then(validateResult)` is a better option.
     */
    validateResult?: ResultValidator<R>
}


type ResultValidator<R=any> = (result: any, req: RpcRequest) => R


interface Req {
    call: RpcRequest | RpcRequest[]
    priority: number
    timeout: number
    retryAttempts: number
    resolve(result: any): void
    reject(error: Error): void
    validateResult?: ResultValidator | undefined
}


export class RpcClient {
    private counter = 0
    private queue = new Heap<Req>(byPriority)
    public readonly url: string
    private con: Connection
    private maxBatchCallSize: number
    private requestTimeout: number
    private retrySchedule: number[]
    private retryAttempts: number
    private capacity: number
    private log?: Logger
    private rate?: RateMeter
    private rateLimit: number = Number.MAX_SAFE_INTEGER
    private schedulingScheduled = false
    private connectionErrorsInRow = 0
    private connectionErrors = 0
    private requestsServed = 0
    private backoffEpoch = 0
    private closed = false

    constructor(options: RpcClientOptions) {
        this.url = trimCredentials(options.url)
        this.con = this.createConnection(options.url)
        this.maxBatchCallSize = options.maxBatchCallSize ?? Number.MAX_SAFE_INTEGER
        this.capacity = options.capacity ?? 10
        this.requestTimeout = options.requestTimeout ?? 0
        this.retryAttempts = options.retryAttempts ?? 0
        this.retrySchedule = options.retrySchedule ?? [10, 100, 500, 2000, 10000, 20000]

        this.log = options.log === null
            ? undefined
            : options.log || createLogger('sqd:rpc-client', {rpcUrl: this.url})

        if (options.rateLimit) {
            assert(Number.isSafeInteger(options.rateLimit))
            assert(options.rateLimit > 1)
            this.rate = new RateMeter()
            this.rateLimit = options.rateLimit
            this.maxBatchCallSize = Math.min(this.maxBatchCallSize, Math.max(1, Math.floor(this.rateLimit / 5)))
        }
    }

    private createConnection(url: string): Connection {
        let protocol = new URL(url).protocol
        switch(protocol) {
            case 'ws:':
            case 'wss:':
                return new WsConnection(url)
            case 'http:':
            case 'https:':
                return new HttpConnection(url, this.log)
            default:
                throw new TypeError(`unsupported protocol: ${protocol}`)
        }
    }

    getMetrics() {
        return {
            url: this.url,
            requestsServed: this.requestsServed,
            connectionErrors: this.connectionErrors
        }
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            let call: RpcRequest = {
                id: this.counter += 1,
                jsonrpc: '2.0',
                method,
                params
            }

            if (this.log?.isDebug()) {
                this.log.debug({
                    rpcId: call.id,
                    rpcMethod: call.method,
                    rpcParams: call.params
                }, 'rpc call')
            }

            this.enqueue({
                call,
                priority: options?.priority ?? 0,
                timeout: options?.timeout ?? this.requestTimeout,
                retryAttempts: options?.retryAttempts ?? this.retryAttempts,
                resolve,
                reject,
                validateResult: options?.validateResult
            })
        })
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return splitParallelWork(
            this.maxBatchCallSize,
            batch,
            b => this.batchCallInternal(b, options)
        )
    }

    private batchCallInternal(batch: {method: string, params?: any[]}[], options?: CallOptions): Promise<any[]> {
        if (batch.length == 0) return Promise.resolve([])
        if (batch.length == 1) return this.call(batch[0].method, batch[0].params, options).then(res => [res])
        return new Promise((resolve, reject) => {
            if (batch.length == 0) return resolve([])

            let calls: RpcRequest[] = batch.map(it => {
                return {
                    ...it,
                    id: this.counter += 1,
                    jsonrpc: '2.0'
                }
            })

            if (this.log?.isDebug()) {
                for (let call of calls) {
                    this.log.debug({
                        rpcId: call.id,
                        rpcMethod: call.method,
                        rpcParams: call.params
                    }, 'rpc call')
                }
            }

            this.enqueue({
                call: calls,
                priority: options?.priority ?? 0,
                timeout: options?.timeout ?? this.requestTimeout,
                retryAttempts: options?.retryAttempts ?? this.retryAttempts,
                resolve,
                reject,
                validateResult: options?.validateResult
            })
        })
    }

    private enqueue(req: Req): void {
        this.assertNotClosed()
        this.queue.push(req)
        this.schedule()
    }

    private schedule(): void {
        if (this.schedulingScheduled || this.closed) return
        if (this.queue.peek() == null || this.capacity <= 0) return
        this.schedulingScheduled = true
        Promise.resolve().then(() => this.performScheduling())
    }

    private delayScheduling(): void {
        this.schedulingScheduled = true
        setTimeout(() => this.performScheduling(), 100)
    }

    private performScheduling(): void {
        this.waitForConnection().then(() => {
            if (this.closed) return
            this.schedulingScheduled = false
            if (this.rate) {
                let now = Date.now()
                let rate = this.rate.getRate(now)
                let rateCapacity = this.rateLimit - rate
                while (this.capacity > 0 && this.queue.peek()) {
                    let req = this.queue.peek()!
                    let size = Array.isArray(req.call) ? req.call.length : 1
                    rateCapacity -= size
                    if (rateCapacity < 0) return this.delayScheduling()
                    this.rate.inc(size, now)
                    this.queue.pop()
                    this.send(req)
                }
            } else {
                while (this.capacity > 0 && this.queue.peek()) {
                    this.send(this.queue.pop()!)
                }
            }
        }, err => {
            this.close(err)
        })
    }

    private send(req: Req): void {
        this.capacity -= 1
        let backoffEpoch = this.backoffEpoch
        let promise: Promise<any>
        if (Array.isArray(req.call)) {
            let call = req.call
            this.log?.debug({rpcBatchId: [call[0].id, last(call).id]}, 'rpc send')
            promise = this.con.batchCall(call, req.timeout).then(res => {
                let result = new Array(res.length)
                for (let i = 0; i < res.length; i++) {
                    result[i] = this.receiveResult(call[i], res[i], req.validateResult)
                }
                return result
            })
        } else {
            let call = req.call
            this.log?.debug({rpcId: call.id}, 'rpc send')
            promise = this.con.call(call, req.timeout).then(res => {
                return this.receiveResult(call, res, req.validateResult)
            })
        }
        promise.then(result => {
            this.requestsServed += 1
            if (this.backoffEpoch == backoffEpoch) {
                this.connectionErrorsInRow = 0
            }
            req.resolve(result)
        }, err => {
            if (this.closed) return req.reject(err)
            if (this.isConnectionError(err)) {
                if (req.retryAttempts > 0) {
                    req.retryAttempts -= 1
                    this.enqueue(req)
                } else {
                    req.reject(err)
                }
                if (this.backoffEpoch == backoffEpoch) {
                    this.backoff(err)
                }
            } else {
                req.reject(err)
            }
        }).finally(() => {
            this.capacity += 1
            this.schedule()
        })
    }

    private async waitForConnection(): Promise<void> {
        while (true) {
            if (this.getBackoffPause()) {
                await wait(this.getBackoffPause())
            }
            if (this.closed) return
            try {
                return await this.con.connect()
            } catch(err: any) {
                if (this.closed) return
                if (err instanceof RpcConnectionError) {
                    this.backoff(err)
                } else {
                    throw err
                }
            }
        }
    }

    private backoff(reason: Error): void {
        this.log?.warn({reason: reason.toString()}, 'connection failure')
        this.backoffEpoch += 1
        this.connectionErrorsInRow += 1
        this.connectionErrors += 1
        this.log?.warn(`will pause new requests for ${this.getBackoffPause()}ms`)
    }

    private getBackoffPause(): number {
        if (this.connectionErrorsInRow == 0) return 0
        let idx = Math.min(this.connectionErrorsInRow, this.retrySchedule.length) - 1
        return this.retrySchedule[idx]
    }

    private receiveResult(call: RpcRequest, res: RpcResponse, validateResult: ResultValidator | undefined): any {
        if (this.log?.isDebug()) {
            this.log.debug({
                rpcId: call.id,
                rpcMethod: call.method,
                rpcParams: call.params,
                rpcResponse: res
            }, 'rpc response')
        }
        try {
            if (res.error) {
                throw new RpcError(res.error)
            } else if (validateResult) {
                return validateResult(res.result, call)
            } else {
                return res.result
            }
        } catch(err: any) {
            throw addErrorContext(err, {
                rpcId: call.id,
                rpcMethod: call.method,
                rpcParams: call.params
            })
        }
    }

    isConnectionError(err: Error): boolean {
        if (err instanceof RetryError) return true
        if (isRateLimitError(err)) return true
        if (err instanceof RpcConnectionError) return true
        if (isHttpConnectionError(err)) return true
        if (err instanceof HttpTimeoutError) return true
        if (err instanceof HttpError) {
            switch(err.response.status) {
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

    close(err?: Error) {
        if (this.closed) return
        this.closed = true
        this.con.close(err)
        while (this.queue.peek()) { // drain queue
            let req = this.queue.pop()!
            req.reject(err || new Error('RpcClient was closed'))
        }
    }

    private assertNotClosed(): void {
        if (this.closed) {
            throw new Error('RpcClient was closed')
        }
    }
}


function byPriority(a: Req, b: Req): number {
    let p = a.priority - b.priority
    if (p != 0) return p
    return getCallPriority(a) - getCallPriority(b)
}


function getCallPriority(req: Req): number {
    if (Array.isArray(req.call)) {
        return req.call[0].id
    } else {
        return req.call.id
    }
}


function trimCredentials(url: string): string {
    let u = new URL(url)
    u.password = ''
    u.username = ''
    return u.toString()
}


function isRateLimitError(err: unknown): boolean {
    return err instanceof RpcError && /rate limit/i.test(err.message)
}
