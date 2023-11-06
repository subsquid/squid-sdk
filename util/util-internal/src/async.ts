import assert from 'assert'
import {assertNotNull} from './misc'


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

    constructor(maxsize: number) {
        assert(maxsize >= 1)
        this.buf = new Array(maxsize)
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
    }

    async *iterate(): AsyncIterable<T> {
        while (true) {
            let val = await this.take()
            if (val === undefined) return
            yield val
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
        err => queue.put({promise: Promise.reject(err)})
    )

    for await (let item of queue.iterate()) {
        yield await item.promise
    }
}
