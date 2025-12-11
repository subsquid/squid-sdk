import {createFuture, type Future} from '@subsquid/util-internal'

export class Timer {
    private timeout?: any

    constructor(private ms: number, private cb: () => void) {}

    start(ms?: number): void {
        if (this.timeout != null) return
        this.timeout = setTimeout(() => {
            this.timeout = undefined
            this.cb()
        }, ms ?? this.ms)
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

    reject(err: Error) {
        let future = this.future
        if (future) {
            this.future = undefined
            future.reject(err)
        }
    }
}
