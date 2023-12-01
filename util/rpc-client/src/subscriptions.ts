import {addErrorContext} from '@subsquid/util-internal'
import type {RpcClient} from './client'
import {RpcConnectionError, RpcError} from './errors'
import {RpcErrorInfo, RpcNotification, RpcRequest} from './interfaces'


export interface Subscription<T> {
    method: string
    params?: unknown[]
    notification: string
    unsubscribe: string
    onMessage: (msg: T) => void
    onError: (err: Error) => void
    resubscribeOnConnectionLoss?: boolean
    retryAttempts?: number
}


export interface SubscriptionHandle {
    readonly isActive: boolean
    readonly isClosed: boolean
    close(): void
}


type SubId = string


export class Subscriptions {
    private active = new Map<SubId, Handle>()

    constructor(private client: RpcClient) {
        this.client.addNotificationListener(msg => this.onNotification(msg))
        this.client.addResetListener(err => this.onReset(err))
    }

    add<T>(sub: Subscription<T>): SubscriptionHandle {
        return new Handle(sub, this.client, this.active)
    }

    private onNotification(msg: RpcNotification): void {
        let subscription: unknown = msg.params?.subscription
        switch(typeof subscription) {
            case 'number':
            case 'string':
                break
            default:
                return
        }
        let id = `${msg.method}::${subscription}`
        let handle = this.active.get(id)
        if (handle == null) return

        let params = msg.params as {
            result: any
            error?: undefined
        } | {
            result?: undefined
            error: RpcErrorInfo
        }

        if (params.error) {
            let err = new RpcError(params.error)
            handle.sub.onError(err)
        } else {
            handle.sub.onMessage(params.result)
        }
    }

    private onReset(err: Error): void {
        for (let handle of this.active.values()) {
            handle.onConnectionReset(err)
        }
    }
}


class Handle implements SubscriptionHandle {
    private closed = false
    private id?: SubId

    constructor(
        public readonly sub: Subscription<any>,
        private client: RpcClient,
        private active: Map<SubId, Handle>
    ) {
        this.subscribe()
    }

    get isActive(): boolean {
        return !this.closed
    }

    get isClosed(): boolean {
        return this.closed
    }

    close(): void {
        if (this.closed) return
        this.closed = true
        this.unsubscribe()
    }

    onConnectionReset(reason: Error): void {
        if (this.closed) return
        this.active.delete(this.id!)
        this.id = undefined
        if (reason instanceof RpcConnectionError && this.sub.resubscribeOnConnectionLoss) {
            this.subscribe()
        } else {
            this.closed = true
            this.sub.onError(reason)
        }
    }

    private subscribe(): void {
        this.client.call(this.sub.method, this.sub.params, {
            retryAttempts: this.sub.retryAttempts,
            validateResult: (result, req) => this.validateSubscriptionResult(result, req)
        }).then(id => {
            this.id = id
            if (this.isActive) {
                this.active.set(this.id, this)
            } else {
                this.unsubscribe()
            }
        }, err => {
            if (this.closed) return
            this.closed = true
            this.sub.onError(err)
        })
    }

    private unsubscribe(): void {
        if (this.id == null) return
        this.active.delete(this.id)
        this.client.call(this.sub.unsubscribe, [this.id], {retryAttempts: 0}).catch(err => {
            if (err instanceof RpcConnectionError) return
            this.client.reset(
                addErrorContext(
                    new RpcConnectionError('connection was reset due to subscription cancellation error'),
                    {rpcSubscriptionCancellationError: err}
                )
            )
        })
    }

    private validateSubscriptionResult(result: unknown, req: RpcRequest): SubId {
        switch(typeof result) {
            case 'string':
            case 'number':
                break
            default:
                this.client.reset()
                throw addErrorContext(
                    new Error(
                        'unexpected subscription result: ' +
                        'only numbers and strings are accepted as subscription ids'
                    ), {
                        rpcResult: result
                    }
                )
        }
        let id = `${this.sub.notification}::${result}`
        if (this.active.has(id)) {
            this.client.reset()
            throw new Error(`got duplicate subscription: ${result}`)
        }
        return id
    }
}
