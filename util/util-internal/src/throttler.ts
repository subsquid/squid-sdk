import {wait} from './misc'


export class Throttler<T> {
    private lastValue!: T
    private lastAccess = -Infinity
    private pending?: Promise<T>
    private prefetch = false

    constructor(
        private fn: () => Promise<T>,
        private interval: number
    ) {}

    enablePrefetch(): this {
        this.prefetch = true
        return this
    }

    disablePrefetch(): this {
        this.prefetch = false
        return this
    }

    call(): Promise<T> {
        if (this.pending) return this.pending
        let pause = this.interval - Date.now() + this.lastAccess
        return this.performCall(pause)
    }

    async get(): Promise<T> {
        let now = Date.now()
        if (now - this.lastAccess < this.interval) {
            return this.lastValue
        }
        let pending = this.performCall(0)
        // A prefetching throttler must not block callers on an in-flight refresh once a value
        // exists — return the last value and let a slow/hung refresh settle in the background.
        return this.prefetch && this.lastAccess > -Infinity ? this.lastValue : pending
    }

    private performCall(pause: number): Promise<T> {
        if (this.pending) return this.pending
        return this.pending = this.execute(pause).finally(() => {
            this.pending = undefined
            if (this.prefetch) {
                let pause = Math.round(this.interval * 0.9)
                this.performCall(pause).catch(() => {})
            }
        })
    }

    private async execute(pause: number): Promise<T> {
        if (pause > 0) {
            await wait(pause)
        }
        this.lastValue = await this.fn()
        this.lastAccess = Date.now()
        return this.lastValue
    }
}
