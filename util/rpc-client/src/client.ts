import {HttpError, HttpTimeoutError, isHttpConnectionError} from '@subsquid/http-client'
import {createLogger, Logger} from '@subsquid/logger'
import {addErrorContext, def, last, splitParallelWork, wait} from '@subsquid/util-internal'
import {Heap} from '@subsquid/util-internal-binary-heap'
import assert from 'assert'
import {RetryError, RpcConnectionError, RpcError} from './errors'
import {Connection, HttpHeaders, RpcCall, RpcErrorInfo, RpcNotification, RpcRequest, RpcResponse} from './interfaces'
import {RateMeter} from './rate'
import {Subscription, SubscriptionHandle, Subscriptions} from './subscriptions'
import {HttpConnection} from './transport/http'
import {WsConnection} from './transport/ws'


export interface RpcClientOptions {
    /**
     * RPC endpoint URL (either http(s) or ws(s))
     */
    url: string
    /**
     * Maximum number of ongoing concurrent requests
     *
     * Batch call is counted as a single request.
     */
    capacity?: number
    /**
     * Maximum number of calls per second
     *
     * Batch call items are counted towards the limit.
     */
    rateLimit?: number
    /**
     * Request timeout in `ms`
     */
    requestTimeout?: number
    /**
     * When set, every call (by default) will be retried specified number of times after connection error.
     */
    retryAttempts?: number
    /**
     * Retry pauses in `ms.
     *
     * First value will be used for a first retry pause,
     * second - for a second, etc.
     *
     * For all further retry attempts the last pause value will be used.
     *
     * Default is `[10, 100, 500, 2000, 10000, 20000]`
     */
    retrySchedule?: number[]
    /**
     * Maximum number of requests in a single batch call
     */
    maxBatchCallSize?: number
    /**
     * Convert unsafe integers to strings in incoming JSON messages
     */
    fixUnsafeIntegers?: boolean
    /**
     * HTTP headers
     */
    headers?: HttpHeaders
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
    validateError?: ErrorValidator<R>
}


type ResultValidator<R=any> = (result: any, req: RpcRequest) => R
type ErrorValidator<R=any> = (info: RpcErrorInfo, req: RpcRequest) => R


interface Req {
    call: RpcRequest | RpcRequest[]
    priority: number
    timeout: number
    retryAttempts: number
    resolve(result: any): void
    reject(error: Error): void
    validateResult?: ResultValidator | undefined
    validateError?: ErrorValidator | undefined
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
    private maxCapacity: number
    private log?: Logger
    private rate?: RateMeter
    private rateLimit: number = Number.MAX_SAFE_INTEGER
    private schedulingScheduled = false
    private connectionErrorsInRow = 0
    private connectionErrors = 0
    private requestsServed = 0
    private notificationsReceived = 0
    private backoffEpoch = 0
    private backoffTime?: number
    private notificationListeners: ((msg: RpcNotification) => void)[] = []
    private resetListeners: ((reason: Error) => void)[] = []
    private closed = false

    constructor(options: RpcClientOptions) {
        this.url = trimCredentials(options.url)
        this.con = this.createConnection(options.url, options.fixUnsafeIntegers || false, options.headers)
        this.maxBatchCallSize = options.maxBatchCallSize ?? Number.MAX_SAFE_INTEGER
        this.capacity = this.maxCapacity = options.capacity || 10
        this.requestTimeout = options.requestTimeout ?? 0
        this.retryAttempts = options.retryAttempts ?? 0
        this.retrySchedule = options.retrySchedule ?? [10, 100, 500, 2000, 10000, 20000]

        this.log = options.log === null
            ? undefined
            : options.log || createLogger('sqd:rpc-client', {rpcUrl: this.url})

        if (options.rateLimit) {
            assert(options.rateLimit > 0)
            let window = 10
            let slotTime = 100
            if (options.rateLimit < 1) {
                slotTime = Math.ceil(1000 / (options.rateLimit * window))
            }
            this.rate = new RateMeter(window, slotTime)
            this.rateLimit = options.rateLimit
            this.maxBatchCallSize = Math.min(this.maxBatchCallSize, Math.max(1, Math.floor(this.rateLimit / 5)))
        }
    }

    private createConnection(url: string, fixUnsafeIntegers: boolean, headers?: HttpHeaders): Connection {
        let protocol = new URL(url).protocol
        switch(protocol) {
            case 'ws:':
            case 'wss:':
                return new WsConnection({
                    url,
                    headers,
                    onNotificationMessage: msg => this.onNotification(msg),
                    onReset: reason => {
                        if (this.closed) return
                        for (let cb of this.resetListeners) {
                            this.safeCallback(cb, reason)
                        }
                    },
                    fixUnsafeIntegers
                })
            case 'http:':
            case 'https:':
                return new HttpConnection({
                    url,
                    headers,
                    log: this.log,
                    fixUnsafeIntegers
                })
            default:
                throw new TypeError(`unsupported protocol: ${protocol}`)
        }
    }

    getConcurrency(): number {
        return this.maxCapacity
    }

    getMetrics() {
        return {
            url: this.url,
            requestsServed: this.requestsServed,
            connectionErrors: this.connectionErrors,
            notificationsReceived: this.notificationsReceived
        }
    }

    private onNotification(msg: RpcNotification): void {
        this.notificationsReceived += 1
        this.log?.debug({rpcMsg: msg}, 'rpc notification')
        for (let cb of this.notificationListeners) {
            this.safeCallback(cb, msg)
        }
    }

    private safeCallback<T>(cb: (arg: T) => void, arg: T): void {
        try {
            cb(arg)
        } catch(err: any) {
            this.log?.error(err, 'callback error')
        }
    }

    addNotificationListener(cb: (msg: RpcNotification) => void): void {
        this.notificationListeners.push(cb)
    }

    removeNotificationListener(cb: (msg: RpcNotification) => void): void {
        removeItem(this.notificationListeners, cb)
    }

    addResetListener(cb: (reason: Error) => void): void {
        this.resetListeners.push(cb)
    }

    removeResetListener(cb: (reason: Error) => void): void {
        removeItem(this.resetListeners, cb)
    }

    subscribe<T>(sub: Subscription<T>): SubscriptionHandle {
        return this.subscriptions().add(sub)
    }

    @def
    private subscriptions(): Subscriptions {
        assert(this.supportsNotifications(), 'subscriptions are only supported by websocket connections')
        return new Subscriptions(this)
    }

    supportsNotifications(): boolean {
        return this.con instanceof WsConnection
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
                validateResult: options?.validateResult,
                validateError: options?.validateError,
            })
        })
    }

    batchCall<T=any>(batch: RpcCall[], options?: CallOptions<T>): Promise<T[]> {
        return splitParallelWork(
            this.maxBatchCallSize,
            batch,
            b => this.batchCallInternal(b, options)
        )
    }

    private batchCallInternal(batch: RpcCall[], options?: CallOptions): Promise<any[]> {
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
                validateResult: options?.validateResult,
                validateError: options?.validateError
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

    private performScheduling(): void {
        this.waitForConnection().then(() => {
            if (this.rate) {
                this.performRateLimitedScheduling(this.rate)
            } else {
                if (this.closed) return
                this.schedulingScheduled = false
                while (this.capacity > 0 && this.queue.peek()) {
                    this.send(this.queue.pop()!)
                }
            }
        }, err => {
            this.close(err)
        })
    }

    private performRateLimitedScheduling(rateMeter: RateMeter): void {
        if (this.closed) return
        this.schedulingScheduled = false

        let now = Date.now()
        let rate = rateMeter.getRate(now)
        let rateCapacity = this.rateLimit - rate

        while (this.capacity > 0 && this.queue.peek()) {
            if (rateCapacity <= 0) {
                this.schedulingScheduled = true
                setTimeout(() => this.performScheduling(), rateMeter.slotTime)
                return
            }
            let req = this.queue.pop()!
            let size = Array.isArray(req.call) ? req.call.length : 1
            rateCapacity -= size
            rateMeter.inc(size, now)
            this.send(req)
        }
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
                    result[i] = this.receiveResult(call[i], res[i], req.validateResult, req.validateError)
                }
                return result
            })
        } else {
            let call = req.call
            this.log?.debug({rpcId: call.id}, 'rpc send')
            promise = this.con.call(call, req.timeout).then(res => {
                return this.receiveResult(call, res, req.validateResult, req.validateError)
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
                    this.backoff(err, req)
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
            if (this.backoffTime != null) {
                let pause = Math.max(this.backoffTime - Date.now(), 0)
                this.backoffTime = undefined
                if (pause > 0) {
                    await wait(pause)
                }
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

    private backoff(reason: Error, req?: Req): void {
        this.backoffEpoch += 1
        this.connectionErrorsInRow += 1
        this.connectionErrors += 1

        let backoffPause = this.retrySchedule[
            Math.min(this.connectionErrorsInRow, this.retrySchedule.length) - 1
        ]

        this.backoffTime = Date.now() + backoffPause

        if (this.log?.isWarn()) {
            let httpResponseBody = undefined
            if (reason instanceof HttpError &&
                reason.response.body &&
                !reason.response.headers.get('content-type')?.includes('text/html')
            ) {
                httpResponseBody = reason.response.body
            }
            this.log.warn({
                reason: reason.toString(),
                httpResponseBody,
                rpcCall: req?.call
            }, 'connection failure')
            this.log.warn(`will pause new requests for ${backoffPause}ms`)
        }
    }

    private receiveResult(
        call: RpcRequest,
        res: RpcResponse,
        validateResult: ResultValidator | undefined,
        validateError: ErrorValidator | undefined
    ): any {
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
                if (validateError) {
                    return validateError(res.error, call)
                } else {
                    throw new RpcError(res.error)
                }
            } else if (validateResult) {
                return validateResult(res.result, call)
            } else {
                return res.result
            }
        } catch(err: any) {
            throw addErrorContext(err, {
                rpcUrl: this.url,
                rpcId: call.id,
                rpcMethod: call.method,
                rpcParams: call.params,
                rpcResponse: res
            })
        }
    }

    isConnectionError(err: Error): boolean {
        if (err instanceof RetryError) return true
        if (isRateLimitError(err)) return true
        if (isExecutionTimeoutError(err)) return true
        if (isRequestTimedOutError(err)) return true
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

    reset(reason?: RpcConnectionError): void {
        if (this.closed) return
        if (this.con instanceof WsConnection) {
            this.con.close(reason || new RpcConnectionError('client was reset'))
        }
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


function isExecutionTimeoutError(err: unknown): boolean {
    return err instanceof RpcError && /execution timeout/i.test(err.message)
}

function isRequestTimedOutError(err: unknown): boolean {
    return err instanceof RpcError && /request.*timed out/i.test(err.message)
}

function removeItem<T>(arr: T[], item: T): void {
    let index = arr.indexOf(item)
    if (index < 0) return
    arr.splice(index, 1)
}
