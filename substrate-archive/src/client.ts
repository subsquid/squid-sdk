import type {Logger} from "@subsquid/logger"
import {RpcClient, RpcConnectionError} from "@subsquid/rpc-client"
import {last} from "@subsquid/util-internal"
import {Speed} from "@subsquid/util-internal-counters"
import assert from "assert"


interface Req {
    id: number
    priority: number
    method: string
    params?: unknown[]
    resolve(val: any): void
    reject(err: Error): void
    promise(): Promise<any>
}


export class Client {
    private timer = new Timer()
    private queue = new RequestQueue<Req>()
    private connections: Connection[]
    private schedulingScheduled = false
    private timeoutSeconds = 20
    private counter = 0

    constructor(endpoints: string[], private log?: Logger) {
        assert(endpoints.length > 0, 'at least 1 RPC endpoint is required')
        this.connections = endpoints.map((url, idx) => {
            let id = idx + 1
            return new Connection(
                id,
                url,
                this.timer,
                () => this.performScheduling(),
                this.log?.child({endpoint: id, url})
            )
        })
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
            if (con.waitTime() > 0) continue
            let eta = con.waitTime() + con.avgResponseTime()
            let n = 0
            for (let j = 0; j < i; j++) {
                let fc = this.connections[j]
                n += Math.floor(Math.max(eta - fc.waitTime(), 0) / fc.avgResponseTime())
            }
            let req = this.queue.take(n)
            if (req == null && Math.random() < 0.1) {
                req = this.queue.takeLast()
            }
            if (req) {
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
        this.addTimeout(con.call(req.method, req.params)).then(
            res => {
                req.resolve(res)
                req.promise().finally(() => this.performScheduling())
                this.timer.nextEpoch()
                let duration = con.success()
                con.log?.debug({
                    req: req.id,
                    responseTime: Math.round(Number(duration) / 1000_000)
                }, 'response')
            },
            (err: Error) => {
                if (err instanceof RpcConnectionError) {
                    con.reset(err)
                    this.queue.push(req)
                    this.performScheduling()
                } else {
                    con.error()
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
    private connectionErrors = 0
    private backoff = [100, 1000, 10000, 30000]
    private busy = false
    private closed = false

    constructor(
        public readonly id: number,
        public readonly url: string,
        private timer: Timer,
        private onNewConnection: () => void,
        public readonly log?: Logger
    ) {
        this.client = new RpcClient(this.url)
        this.connect()
    }

    call(method: string, params?: unknown[]): Promise<any> {
        this.busy = true
        this.speed.start(this.timer.time())
        return this.client.call(method, params)
    }

    success(): bigint {
        this.connectionErrors = 0
        this.busy = false
        return this.speed.stop(1, this.timer.time())
    }

    error(): void {
        this.connectionErrors = 0
        this.busy = false
    }

    reset(err: Error) {
        this.client.close(err)
    }

    close() {
        this.closed = true
        this.client.close()
    }

    private reconnect(err: Error): void {
        if (this.closed) return
        let timeout = this.backoff[Math.min(this.connectionErrors, this.backoff.length - 1)]
        this.connectionErrors += 1
        this.busy = false
        this.log?.warn({
            err,
            backoff: timeout
        })
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
        if (!this.client.isConnected) return 1_000_000
        if (this.busy) {
            return this.avgResponseTime() * 2
        } else {
            return 0
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

    take(skip: number): R | undefined {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i]
            if (skip < item.length) {
                if (item.length == 1) {
                    this.items.splice(i, 1)
                    return item[0]
                } else {
                    let val = item[skip]
                    item.splice(skip, 1)
                    return val
                }
            } else {
                skip -= item.length
            }
        }
    }

    takeLast(): R | undefined {
        if (this.items.length == 0) return
        let item = last(this.items)
        if (item.length == 1) {
            this.items.pop()
            return item[0]
        } else {
            return item.pop()
        }
    }

    isEmpty(): boolean {
        return this.items.length == 0
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
