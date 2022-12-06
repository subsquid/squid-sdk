import {safeCall} from './util'


export interface ProcessingQueueOptions {
    processingConcurrency: number
    maxWaiting: number
}


export interface ProcessingTask {
    (sig: AbortSignal): Promise<void>
}


interface Item {
    id: number
    task: ProcessingTask
}


interface RunningItem extends Item {
    abort: Abort
}


export class ProcessingQueue {
    private ids = 0
    private running: RunningItem[] = []
    private waiting: Item[] = []
    private waitingPromise?: {resolve: () => void, promise: Promise<void>}

    constructor(private options: ProcessingQueueOptions) {}

    async push(task: ProcessingTask): Promise<number> {
        let id = this.ids += 1
        if (this.running.length >= this.options.processingConcurrency) {
            this.waiting.push({id, task})
            if (this.waiting.length > this.options.maxWaiting && this.waitingPromise == null) {
                let promise = new Promise<void>(resolve => {
                    this.waitingPromise = {resolve, promise}
                })
            }
            await this.waitingPromise?.promise
        } else {
            throw new Error('not implemented')
        }
        return id
    }

    cancel(id: number): void {
        throw new Error('not implemented')
    }

    cancelAll(): void {
        throw new Error('not implemented')
    }
}


class Abort implements AbortSignal {
    private _isAborted = false
    private callbacks?: (() => void)[]

    abort(): void {
        if (this._isAborted) return
        this._isAborted = true
        let cbs = this.callbacks
        if (cbs) {
            this.callbacks = undefined
            for (let i = 0; i < cbs.length; i++) {
                safeCall(cbs[i])
            }
        }
    }

    get isAborted(): boolean {
        return this._isAborted
    }

    onAbort(cb: () => void): void {
        if (this.isAborted) {
            safeCall(cb)
        } else if (this.callbacks) {
            this.callbacks.push(cb)
        } else {
            this.callbacks = [cb]
        }
    }
}


export interface AbortSignal {
    readonly isAborted: boolean
    onAbort(cb: () => void): void
}
