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
}


export interface Connection {
    send(req: Req): Promise<boolean>
    isOnline(): boolean
    getAvgResponseTime(): number
    getCapacity(): number
    getMaxCapacity(): number
    getMetrics(): RpcConnectionMetrics
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
}


export abstract class ConnectionBase implements Connection {
    public onlineCallback?: () => void

    public readonly id: number
    public readonly url: string
    protected readonly requestTimeout: number
    private maxCapacity: number
    private capacity: number
    private online = true
    private epoch = 0
    private backoffSchedule = [10, 100, 500, 2000, 10000, 20000]
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
    }

    getAvgResponseTime(): number {
        return this.speed.speed() || 10
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
            avgResponseTimeSeconds: this.getAvgResponseTime(),
            connectionErrors: this.connectionErrorsInRow
        }
    }

    isOnline(): boolean {
        return this.online
    }

    async send(req: Req): Promise<boolean> {
        if (!this.online) return false
        let epoch = this.epoch
        assert(this.capacity > 0)
        this.capacity -= 1
        try {
            let beg = getTime()
            let result = await this.call(req.method, req.params)
            let end = getTime()
            this.speed.push(1, beg, end)
            req.resolve(result)
            this.connectionErrorsInRow = 0
            this.requestsServed += 1
            return true
        } catch(err: any) {
            if (this.isRetryableError(err)) {
                if (this.epoch == epoch) this.backoff()
                return false
            } else {
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
        this.connectionErrorsInRow += 1
        this.epoch += 1
        this.online = false
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined
            this.reconnect().then(() => {
                this.online = true
                this.onlineCallback?.()
            }, err => {
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
    }

    protected abstract call(method: string, params?: unknown[]): Promise<any>

    protected abstract isRetryableError(err: unknown): boolean

    protected abstract reconnect(): Promise<void>

    protected abstract cleanup(): void
}
