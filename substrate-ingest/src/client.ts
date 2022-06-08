import type {Logger} from "@subsquid/logger"
import {RpcClient, RpcConnectionError, RpcError} from "@subsquid/rpc-client"
import {isRateLimitError, isRetryableError} from "@subsquid/rpc-client/lib/resilient"
import {last} from "@subsquid/util-internal"
import {Speed} from "@subsquid/util-internal-counters"
import assert from "assert"
import {addErrorContext} from "./util"


export interface RpcConnectionMetrics {
    id: number
    url: string
    avgResponseTimeSeconds: number
    requestsServed: number
    connectionErrors: number
}


interface Req {
    id: number
    priority: number
    method: string
    params?: unknown[]
    resolve(val: any): void
    reject(err: Error): void
    promise(): Promise<any>
}


export interface Endpoint {
    url: string
    capacity?: number
}


export class Client {
    private timer = new Timer()
    private queue = new RequestQueue<Req>()
    private connections: Connection[]
    private schedulingScheduled = false
    private counter = 0

    constructor(endpoints: Endpoint[], private log?: Logger) {
        assert(endpoints.length > 0, 'at least 1 RPC endpoint is required')
        this.connections = endpoints.map((ep, idx) => {
            let id = idx + 1
            return new Connection(
                id,
                ep.url,
                ep.capacity || 5,
                this.timer,
                () => this.performScheduling(),
                20,
                this.log?.child({connection: id, url: ep.url})
            )
        })
    }

    getConnectionMetrics(): RpcConnectionMetrics[] {
        return this.connections.map(con => con.metrics()).sort((a, b) => a.id - b.id)
    }

    /**
     * Create request label for debug purposes
     */
    private nextRequestId(): number {
        this.counter = (this.counter + 1) % 10000
        return this.counter
    }

    call<T=any>(method: string, params?: unknown[]): Promise<T>
    call<T=any>(priority: number, method: string, params?: unknown[]): Promise<T>
    call<T=any>(methodOrPriority: number | string, paramsOrMethod?: string | unknown[], args?: unknown[]): Promise<T> {
        let priority = 0
        let method: string
        let params: unknown[] | undefined
        if (typeof methodOrPriority == 'string') {
            method = methodOrPriority
            params = paramsOrMethod as unknown[] | undefined
        } else {
            priority = methodOrPriority
            method = paramsOrMethod as string
            params = args
        }
        this.schedule()
        let promise = new Promise<T>((resolve, reject) => {
            this.queue.push({
                id: this.nextRequestId(),
                priority,
                method,
                params,
                resolve,
                reject,
                promise: () => promise
            })
        })
        return promise
    }

    private schedule(): void {
        if (this.schedulingScheduled) return
        this.schedulingScheduled = true
        process.nextTick(() => {
            this.schedulingScheduled = false
            this.performScheduling()
        })
    }

    private performScheduling() {
        this.timer.nextEpoch()
        this.connections.sort((a, b) => {
            return a.waitTime() + a.avgResponseTime() - b.waitTime() - b.avgResponseTime()
        })
        for (let i = 0; i < this.connections.length && !this.queue.isEmpty(); i++) {
            let con = this.connections[i]
            if (!(con.isConnected && con.capacity > 0)) continue
            let eta = con.avgResponseTime()
            let n = 0
            for (let j = 0; j < i; j++) {
                let fc = this.connections[j]
                if (fc.isConnected) {
                    n += fc.maxCapacity * Math.floor(Math.max(eta - fc.waitTime(), 0) / fc.avgResponseTime())
                }
            }
            let requests = this.queue.take(n, con.capacity)
            if (requests.length == 0 && this.queue.isNotEmpty() && Math.random() < 0.1) {
                requests = this.queue.takeLast()
            }
            for (let req of requests) {
                this.execute(con, req, n)
            }
        }
    }

    private execute(con: Connection, req: Req, order: number): void {
        con.call(req, order).then(
            res => {
                req.resolve(res)
                req.promise().finally(() => this.performScheduling())
            },
            (err: Error) => {
                if (isRetryableError(err)) {
                    this.queue.push(req)
                    this.performScheduling()
                } else {
                    req.reject(err)
                    req.promise().finally(() => this.performScheduling())
                }
            }
        )
    }
}


class Connection {
    private client: RpcClient
    private speed = new Speed({windowSize: 500})
    private connectionErrorsInRow = 0
    private connectionErrors = 0
    private served = 0
    private backoff = [100, 1000, 10000, 30000]
    private cap = 0
    private closed = false
    private epoch = 0

    constructor(
        public readonly id: number,
        public readonly url: string,
        public readonly maxCapacity: number,
        private timer: Timer,
        private onNewConnection: () => void,
        private timeoutSeconds: number,
        public readonly log?: Logger
    ) {
        this.cap = this.maxCapacity
        this.client = new RpcClient(this.url)
        this.connect()
    }

    get isConnected(): boolean {
        return this.client.isConnected
    }

    get capacity(): number {
        return this.cap
    }

    call(req: Req, order?: number): Promise<any> {
        if (!this.isConnected) return Promise.reject(new Error('Client is not connected'))
        this.log?.debug({
            avgResponseTime: Math.round(this.avgResponseTime()),
            order,
            req: req.id,
            method: req.method,
            priority: req.priority
        }, 'request')
        let beg = this.timer.time()
        let epoch = this.epoch
        this.cap -= 1
        return this.addTimeout(this.client.call(req.method, req.params)).then(res => {
            this.cap += 1
            this.served += 1
            this.connectionErrorsInRow = 0
            this.timer.nextEpoch()
            let end = this.timer.time()
            this.speed.push(1, beg, end)
            this.log?.debug({
                req: req.id,
                responseTime: Math.round(Number(end - beg) / 1000_000)
            }, 'response')
            return res
        }, err => {
            this.cap += 1
            if (isRetryableError(err)) {
                this.log?.debug({req: req.id}, 'connection failure')
                if (epoch == this.epoch) {
                    this.epoch += 1
                    this.client.close(err)
                }
            } else {
                this.log?.debug({req: req.id}, 'error response')
                this.connectionErrorsInRow = 0
                err = addErrorContext(err, {
                    rpcConnection: this.id,
                    rpcUrl: this.url,
                    rpcRequestId: req.id,
                    rpcMethod: req.method
                })
            }
            throw err
        })
    }

    private addTimeout(res: Promise<any>): Promise<any> {
        if (this.timeoutSeconds == 0) return res
        return new Promise((resolve, reject) => {
            let timeout: any = setTimeout(() => {
                timeout = undefined
                reject(new RpcConnectionError(`Request timed out in ${this.timeoutSeconds} seconds`))
            }, this.timeoutSeconds * 1000)
            res.finally(() => {
                if (timeout != null) {
                    clearTimeout(timeout)
                }
            }).then(resolve, reject)
        })
    }

    close() {
        this.closed = true
        this.client.close()
    }

    private reconnect(err: Error): void {
        if (this.closed) return
        let backoff = this.backoff[Math.min(this.connectionErrorsInRow, this.backoff.length - 1)]
        this.connectionErrors += 1
        this.connectionErrorsInRow += 1
        this.epoch += 1
        if (isRateLimitError(err)) {
            backoff = backoff * 2 + 5000
        }
        this.log?.warn({
            backoff,
            reason: err.message
        }, 'connection error')
        setTimeout(() => {
            this.client = new RpcClient(this.url)
            this.connect()
        }, backoff)
    }

    private connect(): void {
        this.client.connect().then(
            () => {
                this.log?.debug('connected')
                this.client.onclose = err => this.reconnect(err)
                this.onNewConnection()
            },
            err => this.reconnect(err)
        )
    }

    avgResponseTime(): number {
        let speed = this.speed.speed()
        if (speed == 0) return 10
        return 1000 / speed
    }

    waitTime(): number {
        if (this.capacity > 0 && this.isConnected) {
            return 0
        } else {
            return this.avgResponseTime() * 1.5
        }
    }

    metrics(): RpcConnectionMetrics {
        let speed = this.speed.speed()
        let avgResponseTimeSeconds = speed ? 1 / speed : 0
        return {
            id: this.id,
            url: this.url,
            avgResponseTimeSeconds,
            requestsServed: this.served,
            connectionErrors: this.connectionErrors
        }
    }
}


class RequestQueue<R extends {priority: number}> {
    private items: R[][] = []

    push(req: R): void {
        let i = 0
        while (i < this.items.length && this.items[i][0].priority < req.priority) {
            i += 1
        }
        if (i == this.items.length) {
            this.items.push([req])
        } else if (this.items[i][0].priority == req.priority) {
            this.items[i].push(req)
        } else {
            this.items.splice(i, 0, [req])
        }
    }

    take(skip: number, count: number): R[] {
        let requests: R[] = []
        for (let i = 0; i < this.items.length && count > 0; i++) {
            let item = this.items[i]
            if (skip < item.length) {
                let taking = Math.min(count, item.length - skip)
                if (taking == item.length) {
                    requests.push(...item)
                    this.items.splice(i, 1)
                } else {
                    requests.push(...item.splice(skip, taking))
                }
                count -= taking
            } else {
                skip -= item.length
            }
        }
        return requests
    }

    takeLast(): R[] {
        if (this.items.length == 0) return []
        let item = last(this.items)
        if (item.length == 1) {
            return this.items.pop()!
        } else {
            return [item.pop()!]
        }
    }

    isEmpty(): boolean {
        return this.items.length == 0
    }

    isNotEmpty(): boolean {
        return this.items.length > 0
    }
}


class Timer {
    private epochTime?: bigint

    nextEpoch(): void {
        this.epochTime = undefined
    }

    time(): bigint {
        if (this.epochTime == null) {
            this.epochTime = process.hrtime.bigint()
        }
        return this.epochTime
    }
}
