import assert from 'assert'
import * as process from 'process'
import {assertNotNull, ensureError} from './misc'


export interface Future<T> {
    resolve: (val: T) => void
    reject: (err: Error) => void
    promise: () => Promise<T>
}


export function createFuture<T>(): Future<T> {
    let future: Future<T> | undefined
    let promise = new Promise<T>((resolve, reject) => {
        future = {
            resolve,
            reject,
            promise: () => promise
        }
    })
    return assertNotNull(future)
}


export class ClosedQueueError extends Error {
    constructor() {
        super('Queue was closed, no more puts are allowed!')
    }

    get name(): string {
        return 'AsyncQueueWasClosed'
    }
}


export class AsyncQueue<T> {
    private buf: (T | undefined)[]
    private pos = 0
    private size = 0
    private closed = false
    private putFuture?: Future<void>
    private takeFuture?: Future<T | undefined>
    private closeListeners?: (() => void)[]

    constructor(maxsize: number) {
        assert(maxsize >= 1)
        this.buf = new Array(maxsize)
    }

    isClosed(): boolean {
        return this.closed
    }

    async put(val: T): Promise<void> {
        if (this.closed) throw new ClosedQueueError()

        assert(this.size < this.buf.length && this.putFuture == null, 'concurrent puts are not allowed')

        if (this.takeFuture) {
            this.takeFuture.resolve(val)
            this.takeFuture = undefined
        } else {
            this.buf[(this.pos + this.size) % this.buf.length] = val
            this.size += 1
            if (this.size == this.buf.length) {
                this.putFuture = createFuture()
                await this.putFuture.promise()
            }
        }
    }

    forcePut(val: T): void {
        if (this.closed) throw new ClosedQueueError()
        if (this.takeFuture) {
            this.takeFuture.resolve(val)
            this.takeFuture = undefined
        } else if (this.size < this.buf.length) {
            this.buf[(this.pos + this.size) % this.buf.length] = val
            this.size += 1
        } else {
            this.buf[(this.pos + this.size - 1) % this.buf.length] = val
        }
    }

    tryPut(val: T): void {
        this.put(val).catch(err => {})
    }

    async take(): Promise<T | undefined> {
        if (this.size > 0) {
            let val = this.buf[this.pos]!
            this.buf[this.pos] = undefined
            this.pos = (this.pos + 1) % this.buf.length
            this.size -= 1
            if (this.putFuture) {
                this.putFuture.resolve()
                this.putFuture = undefined
            }
            return val
        } else if (this.closed) {
            return undefined
        } else {
            assert(this.takeFuture == null, 'concurrent takes are not allowed')
            this.takeFuture = createFuture()
            return this.takeFuture.promise()
        }
    }

    peek(): T | undefined {
        return this.buf[this.pos]
    }

    close(): void {
        this.closed = true
        if (this.putFuture) {
            this.putFuture.reject(new ClosedQueueError())
            this.putFuture = undefined
        }
        if (this.takeFuture) {
            this.takeFuture.resolve(undefined)
            this.takeFuture = undefined
        }
        if (this.closeListeners) {
            for (let cb of this.closeListeners) {
                safeCall(cb)
            }
            this.closeListeners = undefined
        }
    }

    addCloseListener(cb: () => void): void {
        if (this.closed) return process.nextTick(() => safeCall(cb))
        if (this.closeListeners == null) {
            this.closeListeners = [cb]
        } else {
            this.closeListeners.push(cb)
        }
    }

    async *iterate(): AsyncIterable<T> {
        try {
            while (true) {
                let val = await this.take()
                if (val === undefined) return
                yield val
            }
        } finally {
            this.close()
        }
    }
}


export async function* concurrentMap<T, R>(
    concurrency: number,
    stream: AsyncIterable<T>,
    f: (val: T) => Promise<R>
): AsyncIterable<R> {
    let queue = new AsyncQueue<{promise: Promise<R>}>(concurrency)

    async function map() {
        for await (let val of stream) {
            let promise = f(val)
            promise.catch(() => {}) // prevent unhandled rejection crashes
            await queue.put({promise})
        }
    }

    map().then(
        () => queue.close(),
        err => {
            let promise = Promise.reject(err)
            promise.catch(() => {}) // prevent unhandled rejection crashes
            queue.tryPut({promise})
        }
    )

    for await (let item of queue.iterate()) {
        yield await item.promise
    }
}


export async function* concurrentWriter<T>(
    watermark: number,
    cb: (write: (val: T) => Promise<void>) => Promise<void>
): AsyncIterable<T> {
    assert(watermark >= 1)

    let queue = new AsyncQueue<T | Error>(watermark)

    cb(value => queue.put(value)).then(
        () => queue.close(),
        err => {
            if (!queue.isClosed()) {
                queue.forcePut(ensureError(err))
            }
        }
    )

    for await (let valueOrError of queue.iterate()) {
        if (valueOrError instanceof Error) throw valueOrError
        yield valueOrError
    }
}


export function safeCall(cb: () => void): void {
    try {
        cb()
    } catch(err: any) {
        Promise.reject(err)
    }
}
