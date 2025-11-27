import {createFuture, Future} from './async'


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
