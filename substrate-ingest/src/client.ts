import type {Logger} from "@subsquid/logger"
import {RpcClient, RpcConnectionError} from "@subsquid/rpc-client"
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
    private timeoutSeconds = 20
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
            if (con.capacity == 0) continue
            let eta = con.avgResponseTime()
            let n = 0
            for (let j = 0; j < i; j++) {
                let fc = this.connections[j]
                n += con.maxCapacity * Math.floor(Math.max(eta - fc.waitTime(), 0) / fc.avgResponseTime())
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
        con.log?.debug({
            avgResponseTime: Math.round(con.avgResponseTime()),
            order,
            req: req.id,
            method: req.method,
            priority: req.priority
        }, 'request')
        this.addTimeout(con.call(req.id, req.method, req.params)).then(
            res => {
                req.resolve(res)
                req.promise().finally(() => this.performScheduling())
            },
            (err: Error) => {
                if (err instanceof RpcConnectionError) {
                    con.log?.debug({req: req.id}, 'connection failure')
                    con.reset(err)
                    this.queue.push(req)
                    this.performScheduling()
                } else {
                    con.log?.debug({req: req.id}, 'error response')
                    err = addErrorContext(err, {
                        rpcConnection: con.id,
                        rpcUrl: con.url,
                        rpcRequestId: req.id,
                        rpcMethod: req.method
                    })
                    req.reject(err)
                    req.promise().finally(() => this.performScheduling())
                }
            }
        )
    }

    private addTimeout(res: Promise<any>): Promise<any> {
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
}


class Connection {
    private client: RpcClient
    private speed = new Speed(500)
    private connectionErrorsInRow = 0
    private connectionErrors = 0
    private served = 0
    private backoff = [100, 1000, 10000, 30000]
    private cap = 0
    private closed = false

    constructor(
        public readonly id: number,
        public readonly url: string,
        public readonly maxCapacity: number,
        private timer: Timer,
        private onNewConnection: () => void,
        public readonly log?: Logger
    ) {
        this.client = new RpcClient(this.url)
        this.connect()
    }

    get capacity(): number {
        return this.cap
    }

    call(id: number, method: string, params?: unknown[]): Promise<any> {
        this.cap -= 1
        let beg = this.timer.time()
        return this.client.call(method, params).then(res => {
            this.served += 1
            this.connectionErrorsInRow = 0
            this.cap += 1
            this.timer.nextEpoch()
            let duration = this.timer.time() - beg
            this.speed.push(1, duration)
            this.log?.debug({
                req: id,
                responseTime: Math.round(Number(duration) / 1000_000)
            }, 'response')
            return res
        }, err => {
            this.connectionErrorsInRow = 0
            this.cap += 1
            throw err
        })
    }

    reset(err: Error) {
        this.cap = 0
        this.client.close(err)
    }

    close() {
        this.cap = 0
        this.closed = true
        this.client.close()
    }

    private reconnect(err: Error): void {
        if (this.closed) return
        let timeout = this.backoff[Math.min(this.connectionErrorsInRow, this.backoff.length - 1)]
        this.connectionErrors += 1
        this.connectionErrorsInRow += 1
        this.cap = this.maxCapacity
        this.log?.warn({
            backoff: timeout,
            reason: err.message
        }, 'connection error')
        setTimeout(() => {
            this.client = new RpcClient(this.url)
            this.connect()
        }, timeout)
    }

    private connect(): void {
        this.client.connect().then(
            () => {
                this.log?.debug('connected')
                this.client.onclose = err => this.reconnect(err)
                this.cap = this.maxCapacity
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
        if (this.cap) {
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
