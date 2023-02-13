import {Logger} from '@subsquid/logger'
import {RpcConnectionError} from '@subsquid/rpc-client'
import {addErrorContext} from '@subsquid/util-internal'
import {CommonConnectionOptions, Connection, Req, RpcConnectionMetrics} from './connection/base'
import {HttpRpcConnection} from './connection/http'
import {WsRpcConnection} from './connection/ws'
import {PriorityQueue} from './queue'


export interface RpcEndpoint {
    url: string
    capacity?: number
}


export interface RpcClientOptions {
    endpoints: RpcEndpoint[]
    retryAttempts?: number
    requestTimeout?: number
    log?: Logger
}


export class RpcClient {
    private connections: Connection[] = []
    private queue = new PriorityQueue<Req>()
    private counter = 0
    private schedulingScheduled = false
    private log?: Logger
    private retryAttempts: number
    private closed = false

    constructor(options: RpcClientOptions) {
        this.log = options.log
        this.retryAttempts = options.retryAttempts ?? Number.MAX_SAFE_INTEGER
        this.connections = options.endpoints.map((ep, id) => {
            let params: CommonConnectionOptions = {
                id,
                url: ep.url,
                capacity: ep.capacity ?? 5,
                requestTimeout: options.requestTimeout ?? 20_000,
                log: this.log?.child({rpcConnection: id, rpcUrl: ep.url}),
                onlineCallback: () => this.schedule()
            }
            let protocol = new URL(ep.url).protocol
            switch(protocol) {
                case 'ws:':
                case 'wss:':
                    return new WsRpcConnection(params)
                case 'http:':
                case 'https:':
                    return new HttpRpcConnection(params)
                default:
                    throw new TypeError(`unsupported protocol: ${protocol}`)
            }
        })
    }

    getMetrics(): RpcConnectionMetrics[] {
        return this.connections.map(con => con.getMetrics()).sort((a, b) => a.id - b.id)
    }

    call<T=any>(method: string, params?: unknown[]): Promise<T>
    call<T=any>(priority: number, method: string, params?: unknown[]): Promise<T>
    call<T=any>(methodOrPriority: number | string, paramsOrMethod?: string | unknown[], args?: unknown[]): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (this.closed) return reject(new RpcConnectionError('client was already closed'))
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
            let id = this.nextRequestId()
            this.log?.debug({
                rpcRequestId: id,
                rpcMethod: method,
                rpcParams: params
            }, 'rpc call')
            this.queue.push({
                id,
                priority,
                method,
                params,
                resolve,
                reject,
                retries: 0
            })
            this.schedule()
        })
    }

    private nextRequestId(): number {
        return this.counter++
    }

    private schedule(): void {
        if (this.schedulingScheduled || this.queue.isEmpty()) return
        this.schedulingScheduled = true
        process.nextTick(() => {
            this.schedulingScheduled = false
            this.performScheduling()
        })
    }

    private performScheduling(): void {
        this.connections.sort((a, b) => {
            let eta_a = a.getCapacity() > 0 ? a.getAvgResponseTime() : 3 * a.getAvgResponseTime()
            let eta_b = b.getCapacity() > 0 ? b.getAvgResponseTime() : 3 * b.getAvgResponseTime()
            return eta_a - eta_b
        })

        let schedule = new Map<Connection, Req[]>()

        for (let i = 0; i < this.connections.length && !this.queue.isEmpty(); i++) {
            let con = this.connections[i]
            if (con.isOnline() && con.getCapacity() > 0) {
                let skip = this.willBeFetchedByFasterConnections(i, con.getAvgResponseTime())
                let requests = this.queue.take(skip, con.getCapacity())
                if (requests.length) {
                    schedule.set(con, requests)
                } else {
                    break
                }
            }
        }

        if (Math.random() < 0.1) {
            this.moveLastRequestToRandomFreeConnection(schedule)
        }

        for (let [con, requests] of schedule) {
            for (let req of requests) {
                this.send(con, req)
            }
        }
    }

    private willBeFetchedByFasterConnections(ci: number, deadline: number): number {
        let n = 0
        for (let i = 0; i < ci; i++) {
            let con = this.connections[i]
            if (con.isOnline()) {
                let avg = con.getAvgResponseTime()
                n += con.getMaxCapacity() * Math.floor(
                    Math.max(deadline - 2 * avg, 0) / avg
                )
            }
        }
        return n
    }

    private moveLastRequestToRandomFreeConnection(schedule: Map<Connection, Req[]>): void {
        let free = this.connections.filter(c => {
            return c.isOnline() && c.getCapacity() == c.getMaxCapacity() && !schedule.has(c)
        })
        if (free.length == 0) return
        let con = free[Math.floor(Math.random() * (free.length - 1))]
        let req = this.queue.takeLast() || this.stealLastRequest(schedule)
        schedule.set(con, [req])
    }

    private stealLastRequest(schedule: Map<Connection, Req[]>): Req {
        let lastRequests: Req[]
        for (let requests of schedule.values()) {
            lastRequests = requests
        }
        return lastRequests!.pop()!
    }

    private send(con: Connection, req: Req): void {
        con.send(req).then(handled => {
            if (this.closed) {
                if (!handled) req.reject(new RpcConnectionError('client was closed'))
            } else if (handled) {
                this.schedule()
            } else if (this.retryAttempts > req.retries) {
                req.retries += 1
                this.queue.push(req)
                this.schedule()
            } else {
                req.reject(
                    addErrorContext(
                        new RpcConnectionError(`failed to perform a call after ${req.retries + 1} attempts`),
                        {
                            rpcRequestId: req.id,
                            rpcRequestMethod: req.method
                        }
                    )
                )
            }
        })
    }

    close(): void {
        if (this.closed) return
        this.closed = true
        for (let con of this.connections) {
            con.close()
        }
        for (let req of this.queue.takeAll()) {
            req.reject(new RpcConnectionError('client was closed'))
        }
    }
}
