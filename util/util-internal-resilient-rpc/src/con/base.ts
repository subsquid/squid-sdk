import {Logger} from '@subsquid/logger'
import {addErrorContext} from '@subsquid/util-internal'
import {Speed} from '@subsquid/util-internal-counters'
import assert from 'assert'
import {getTime} from '../util'


export interface Req {
    id: number
    priority: number
    method: string
    params?: unknown[]
    resolve(val: any): void
    reject(err: Error): void
    retries: number
}


export interface Connection {
    send(req: Req): Promise<boolean>
    isOnline(): boolean
    getAvgResponseTime(): number
    getCapacity(): number
    getMaxCapacity(): number
    getMetrics(): RpcConnectionMetrics
    close(): void
}


export interface RpcConnectionMetrics {
    id: number
    url: string
    avgResponseTimeSeconds: number
    requestsServed: number
    connectionErrors: number
}


export interface CommonConnectionOptions {
    id: number
    url: string
    capacity: number
    requestTimeout: number
    log?: Logger
    onlineCallback?: () => void
}


export abstract class ConnectionBase implements Connection {
    public onlineCallback?: () => void

    public readonly id: number
    public readonly url: string
    protected readonly requestTimeout: number
    protected readonly log?: Logger
    private maxCapacity: number
    private capacity: number
    private online = true
    private epoch = 0
    private backoffSchedule = [10, 100, 500, 2000, 10000, 20000]
    private connectionErrors = 0
    private connectionErrorsInRow = 0
    private requestsServed = 0
    private speed = new Speed({
        windowSize: 200
    })
    private reconnectTimer?: any
    private closed = false

    protected constructor(options: CommonConnectionOptions) {
        this.id = options.id
        this.url = options.url
        this.maxCapacity = options.capacity
        this.capacity = this.maxCapacity
        this.requestTimeout = options.requestTimeout
        this.log = options.log
        this.onlineCallback = options.onlineCallback
    }

    getAvgResponseTime(): number {
        return this.speed.time() || 0.01
    }

    getCapacity(): number {
        return this.capacity
    }

    getMaxCapacity(): number {
        return this.maxCapacity
    }

    getMetrics(): RpcConnectionMetrics {
        return {
            id: this.id,
            url: this.url,
            requestsServed: this.requestsServed,
            avgResponseTimeSeconds: this.speed.time(),
            connectionErrors: this.connectionErrors
        }
    }

    isOnline(): boolean {
        return this.online
    }

    async send(req: Req): Promise<boolean> {
        if (!this.online) return false
        let epoch = this.epoch
        let log = this.log?.child({rpcRequestId: req.id})
        assert(this.capacity > 0)
        this.capacity -= 1
        try {
            log?.debug('rpc send')
            let beg = getTime()
            let result = await this.call(req.id, req.method, req.params)
            let end = getTime()
            this.speed.push(1, beg, end)
            log?.debug({
                rpcTime: Math.round(Number(end - beg) / 1_000_000),
                rpcResult: result
            }, 'rpc result')
            req.resolve(result)
            this.connectionErrorsInRow = 0
            this.requestsServed += 1
            return true
        } catch(err: any) {
            if (this.isRetryableError(err)) {
                log?.warn(err.toString())
                if (this.epoch == epoch) this.backoff()
                return false
            } else {
                addErrorContext(err, {
                    rpcConnection: this.id,
                    rpcUrl: this.url,
                    rpcRequestId: req.id,
                    rpcMethod: req.method
                })
                req.reject(err)
                return true
            }
        } finally {
            this.capacity += 1
        }
    }

    private backoff(): void {
        if (this.closed) return
        let backoff = this.backoffSchedule[Math.min(this.connectionErrorsInRow, this.backoffSchedule.length - 1)]
        this.log?.warn(`going offline for ${backoff} ms`)
        this.connectionErrors += 1
        this.connectionErrorsInRow += 1
        this.epoch += 1
        this.online = false
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined
            this.reconnect().then(() => {
                this.log?.debug('online')
                this.online = true
                this.onlineCallback?.()
            }, err => {
                this.log?.warn({reason: err.toString()}, 'failed to reconnect')
                this.backoff()
            })
        }, backoff)
    }

    close(): void {
        this.closed = true
        this.online = false
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = undefined
        }
        this.cleanup()
        this.log?.debug('closed')
    }

    protected abstract call(id: number, method: string, params?: unknown[]): Promise<any>

    protected abstract isRetryableError(err: unknown): boolean

    protected abstract reconnect(): Promise<void>

    protected abstract cleanup(): void
}
