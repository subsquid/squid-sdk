import assert from "assert"
import {assertNotNull} from "./util"


export class Channel<T> {
    private buf: T[] = []
    private drained: Future<void> | undefined
    private takes: Future<T>[] = []
    private closed = false
    private closedValue?: T

    constructor(private capacity: number) {}

    put(item: T): Promise<void> {
        if (this.closed) {
            return Promise.reject(new ClosedChannelError())
        }
        let take = this.takes.shift()
        if (take) {
            take.resolve(item)
            return Promise.resolve()
        }
        this.buf.push(item)
        if (this.buf.length >= this.capacity) {
            this.drained = this.drained || new Future()
            return this.drained.promise
        } else {
            return Promise.resolve()
        }
    }

    take(): Promise<T> {
        if (this.buf.length) {
            let value = this.buf.shift()!
            if (this.buf.length < this.capacity) {
                let drained = this.drained
                this.drained = undefined
                drained?.resolve()
            }
            return Promise.resolve(value)
        } else if (this.closed) {
            if (this.closedValue === undefined) {
                return Promise.reject(new ClosedChannelError())
            } else {
                return Promise.resolve(this.closedValue)
            }
        } else {
            let future = new Future<T>()
            this.takes.push(future)
            return future.promise
        }
    }

    close(val?: T): void {
        if (this.closed) return
        this.closed = true
        this.closedValue = val
        let drained = this.drained
        this.drained = undefined
        drained?.reject(new ClosedChannelError())
        this.takes.forEach(take => {
            if (this.closedValue === undefined) {
                take.reject(new ClosedChannelError())
            } else {
                take.resolve(this.closedValue)
            }
        })
        this.takes.length = 0
    }
}


export class ClosedChannelError extends Error {
    constructor() {
        super('Channel was closed')
    }
}


export class Future<T> {
    private result?: {value: T, error: null} | {error: Error}
    private cb?: () => void

    resolve(value: T): void {
        this.result = {value, error: null}
        this.cb?.()
    }

    reject(error: Error): void {
        this.result = {error}
        this.cb?.()
    }

    public readonly promise = new Promise<T>((resolve, reject) => {
        if (this.result) {
            this.resolvePromise(resolve, reject)
        } else {
            this.cb = () => this.resolvePromise(resolve, reject)
        }
    })

    private resolvePromise(resolve: (value: T) => void, reject: (error: Error) => void) {
        let result = assertNotNull(this.result)
        if (result.error == null) {
            resolve(result.value)
        } else {
            reject(result.error)
        }
    }
}


export class AbortHandle {
    private abortError: Error | undefined
    private listeners: ((err: Error) => void)[] = []

    get isAborted(): boolean {
        return this.abortError != null
    }

    assertNotAborted(): void {
        if (this.abortError) throw this.abortError
    }

    abort(err?: Error): void {
        if (this.abortError) return
        this.abortError = err || new AbortError()
        for (let i = 0; i < this.listeners.length; i++) {
            safeCall(() => this.listeners[i](this.abortError!))
        }
        this.listeners.length = 0
    }

    addListener(f: (err: Error) => void): void {
        assert(!this.isAborted)
        this.listeners.push(f)
    }

    removeListener(f: (err: Error) => void): void {
        let idx = this.listeners.indexOf(f)
        if (idx >= 0) {
            this.listeners.splice(idx, 1)
        }
    }

    guard<T>(promise: Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.abortError) {
                reject(this.abortError)
                return
            }
            this.addListener(reject)
            promise.then(
                result => {
                    this.removeListener(reject)
                    resolve(result)
                },
                err => {
                    this.removeListener(reject)
                    reject(err)
                }
            )
        })
    }
}


export class AbortError extends Error {
    constructor() {
        super('Aborted')
    }
}


export function wait(ms: number, abort?: AbortHandle): Promise<void> {
    return new Promise((resolve, reject) => {
        abort?.assertNotAborted()

        let timeout = setTimeout(() => {
            abort?.removeListener(onabort)
            resolve()
        }, ms)

        function onabort(err: Error): void {
            clearTimeout(timeout)
            reject(err)
        }

        abort?.addListener(onabort)
    })
}


function safeCall(f: () => void): void {
    try {
        f()
    } catch(e: any) {
        // TODO: log
    }
}
