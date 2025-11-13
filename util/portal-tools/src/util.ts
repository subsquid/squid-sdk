import assert from 'node:assert'


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
    return future!
}


export class Semaphore {
    private future?: Future<void>

    constructor(private isReady: boolean) {}

    wait(): Promise<void> | void {
        if (this.isReady) return
        this.future = this.future || createFuture()
        return this.future.promise()
    }

    ready(): void {
        this.isReady = true
        this.future?.resolve()
        this.future = undefined
    }

    unready(): void {
        this.isReady = false
    }
}


export class Timer {
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


export class NonErrorThrow extends Error {
    constructor(public readonly value: unknown) {
        super('Non-error object was thrown')
    }
}


export function ensureError(val: unknown): Error {
    if (val instanceof Error) {
        return val
    } else {
        return new NonErrorThrow(val)
    }
}


export function last<T>(array: T[]): T {
    assert(array.length > 0)
    return array[array.length - 1]
}


export function project<T extends object, F extends { [K in keyof T]?: boolean }>(
    fields: F | undefined,
    obj: T
): Partial<T> {
    if (fields == null) return {}
    let result: Partial<T> = {}
    let key: keyof T
    for (key in obj) {
        if (fields[key]) {
            result[key] = obj[key]
        }
    }
    return result
}


export function isEmpty(obj: object): boolean {
    for (let _ in obj) {
        return false
    }
    return true
}
