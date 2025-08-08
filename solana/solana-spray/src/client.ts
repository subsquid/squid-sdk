import {RpcClient} from '@subsquid/rpc-client'
import {AsyncQueue, ensureError} from '@subsquid/util-internal'
import {cast} from '@subsquid/util-internal-validation'
import {getDataNotificationSchema} from './data/notification-schema'
import {DataMessage, FieldSelection} from './data/types'
import {getEffectiveFieldSelection} from './data/util'
import {Query} from './query'


export interface SubscribeRequest<F = {}> {
    query: Query<F>
    /**
     * Max size of data messages queue.
     *
     * Oldest excess messages are dropped.
     */
    maxQueueSize?: number
}


export class SprayClient {
    private rpc: RpcClient

    constructor(url: string) {
        this.rpc = new RpcClient({
            url,
            capacity: Number.MAX_SAFE_INTEGER,
            requestTimeout: 10_000
        })
    }

    async *subscribe<F extends FieldSelection = {}>(req: SubscribeRequest<F>): AsyncIterable<DataMessage<F>[]> {
        let fields = getEffectiveFieldSelection(req.query.fields)
        let schema = getDataNotificationSchema(fields)
        let query = prepareQuery({...req.query, fields})
        let maxQueueSize = req.maxQueueSize ?? 50_000

        let queue = new AsyncQueue<DataMessage<F>[] | Error>(2)

        let timer = new Timer(10_000, () => handle.reset())

        function bail(err: unknown): void {
            queue.forcePut(ensureError(err))
            queue.close()
        }

        queue.addCloseListener(() => {
            handle.close()
            timer.stop()
        })

        let handle = this.rpc.subscribe({
            method: 'spraySubscribe',
            params: [query],
            notification: 'sprayNotification',
            unsubscribe: 'sprayUnsubscribe',
            onMessage(msg) {
                timer.reset()

                let batch = queue.peek()
                if (batch instanceof Error) {
                    return
                }

                let data
                try {
                    data = cast(schema, msg)
                } catch(err: any) {
                    return bail(err)
                }

                let item: any
                switch(data.type) {
                    case 'block':
                        item = {
                            type: 'block',
                            slot: data.slot
                        }
                        if (data.header) {
                            let {parentNumber, ...hdr} = data.header
                            item.parentSlot = parentNumber
                            Object.assign(item, hdr)
                        }
                        break
                    case 'transaction':
                        item = data
                        break
                    default:
                        return
                }

                if (batch) {
                    batch.splice(0, Math.max(0, batch.length - maxQueueSize + 1))
                    batch.push(item)
                } else if (!queue.isClosed()) {
                    queue.forcePut([item])
                }
            },
            onError(err) {
                bail(err)
            },
            resubscribeOnConnectionLoss: true,
            retryAttempts: Number.MAX_SAFE_INTEGER
        })

        for await (let batch of queue.iterate()) {
            if (batch instanceof Error) {
                throw batch
            } else {
                yield batch
            }
        }
    }
}


function prepareQuery<F extends FieldSelection>(query: Query<F>): any {
    let prepared: any = {}

    prepared.fields = prepareFields(query.fields ?? {})

    if (query.includeAllBlocks) {
        prepared.includeAllBlocks = true
    }

    prepared.transactions = query.transactions?.map(req => ({...req.where, ...req.include}))
    prepared.instructions = query.instructions?.map(req => ({...req.where, ...req.include}))
    prepared.balances = query.balances?.map(req => ({...req.where, ...req.include}))
    prepared.tokenBalances = query.tokenBalances?.map(req => ({...req.where, ...req.include}))

    return removeEmptyValues(prepared)
}


function prepareFields(fields: FieldSelection): any {
    let {parentSlot, ...restBlock} = fields.block ?? {}

    return removeEmptyValues({
        block: removeFalseValues({
            parentNumber: parentSlot,
            ...restBlock
        }),
        transaction: removeFalseValues(fields.transaction),
        instruction: removeFalseValues(fields.instruction),
        balance: removeFalseValues(fields.balance),
        tokenBalance: removeFalseValues(fields.tokenBalance)
    })
}


function removeFalseValues(obj: any): any {
    let res: any = {}
    for (let key in obj) {
        let val = obj[key]
        if (val) {
            res[key] = val
        }
    }
    return res
}


function removeEmptyValues(obj: any): any {
    let res: any = {}
    for (let key in obj) {
        let val = obj[key]
        if (val == null || typeof val != 'object') continue
        if (Array.isArray(val) && val.length > 0 || Object.keys(val).length > 0) {
            res[key] = val
        }
    }
    return res
}


class Timer {
    private timeout?: any

    constructor(private ms: number, private cb: () => void) {}

    start(): void {
        if (this.timeout != null) return
        this.timeout = setTimeout(() => {
            this.timeout = undefined
            this.cb()
        }, this.ms)
    }

    stop(): void {
        if (this.timeout == null) return
        clearTimeout(this.timeout)
        this.timeout = undefined
    }

    reset(): void {
        this.stop()
        this.start()
    }
}
