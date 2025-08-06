import {RpcClient} from '@subsquid/rpc-client'
import {AsyncQueue, ensureError, last, maybeLast, unexpectedCase} from '@subsquid/util-internal'
import {cast, GetCastType} from '@subsquid/util-internal-validation'
import {getDataNotificationSchema} from './data/notification-schema'
import {PartialBlock} from './data/partial'
import {Block, FieldSelection} from './data/types'
import {getEffectiveFieldSelection} from './data/util'
import {Query} from './query'


type DataNotificationSchema = ReturnType<typeof getDataNotificationSchema>
type DataNotification = GetCastType<DataNotificationSchema>


export class SprayClient {
    private rpc: RpcClient

    constructor(url: string) {
        this.rpc = new RpcClient({
            url,
            capacity: Number.MAX_SAFE_INTEGER,
            requestTimeout: 10_000
        })
    }

    async *subscribe<F extends FieldSelection = {}>(query: Query<F>): AsyncIterable<Block<F>[]> {
        let fields = getEffectiveFieldSelection(query.fields)
        let schema = getDataNotificationSchema(fields)
        let q = prepareQuery({...query, fields})
        let maxQueueSize = 50_000

        let queue = new AsyncQueue<DataNotification[] | Error>(2)

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
            params: [q],
            notification: 'sprayNotification',
            unsubscribe: 'sprayUnsubscribe',
            onMessage(msg) {
                timer.reset()

                let batch = queue.peek()
                if (batch instanceof Error) {
                    return
                }

                let data: DataNotification
                try {
                    data = cast(schema, msg)
                } catch(err: any) {
                    return bail(err)
                }

                if (batch) {
                    batch.splice(0, Math.max(0, batch.length - maxQueueSize + 1))
                    batch.push(data)
                } else if (!queue.isClosed()) {
                    queue.forcePut([data])
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
                yield assembleBlockBatch(batch) as Block<F>[]
            }
        }
    }
}


function assembleBlockBatch(messages: DataNotification[]): PartialBlock[] {
    let batch: PartialBlock[] = []

    for (let msg of messages) {
        let block: PartialBlock
        if (maybeLast(batch)?.slot === msg.slot) {
            block = last(batch)
        } else {
            block = {
                slot: msg.slot,
                transactions: [],
                instructions: [],
                balances: [],
                tokenBalances: [],
                logs: [],
                rewards: [],
            }
            batch.push(block)
        }

        switch(msg.type) {
            case 'block':
                block.header = {slot: msg.slot}
                if (msg.header) {
                    let {parentNumber, ...rest} = msg.header
                    if (parentNumber != null) {
                        block.header.parentSlot = parentNumber
                    }
                    Object.assign(block.header, rest)
                }
                break
            case 'transaction':
                if (msg.transaction) {
                    block.transactions.push({
                        transactionIndex: msg.transactionIndex,
                        ...msg.transaction
                    })
                }
                if (msg.instructions) {
                    for (let ins of msg.instructions) {
                        block.instructions.push({
                            transactionIndex: msg.transactionIndex,
                            ...ins
                        })
                    }
                }
                if (msg.balances) {
                    for (let item of msg.balances) {
                        block.balances.push({
                            transactionIndex: msg.transactionIndex,
                            ...item
                        })
                    }
                }
                if (msg.tokenBalances) {
                    for (let item of msg.tokenBalances) {
                        block.tokenBalances.push({
                            transactionIndex: msg.transactionIndex,
                            ...item
                        })
                    }
                }
                break
            default:
                throw unexpectedCase()
        }
    }

    for (let block of batch) {
        block.transactions.sort((a, b) => a.transactionIndex! - b.transactionIndex!)
        block.instructions.sort((a, b) => a.transactionIndex! - b.transactionIndex!)
    }

    return batch
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
        instruction: removeFalseValues({...fields.instruction, instructionAddress: true}),
        balance: removeFalseValues({...fields.balance, account: true}),
        tokenBalance: removeFalseValues({...fields.tokenBalance, account: true})
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
