import {wait} from './misc'


export class Throttler<T> {
    private lastValue!: T
    private lastAccess = -Infinity

    constructor(
        private fn: () => Promise<T>,
        private interval: number
    ) {}

    async call(): Promise<T> {
        let pause = this.interval - Date.now() + this.lastAccess
        if (pause > 0) {
            await wait(pause)
        }
        this.lastValue = await this.fn()
        this.lastAccess = Date.now()
        return this.lastValue
    }

    async get(): Promise<T> {
        let now = Date.now()
        if (now - this.lastAccess < this.interval) {
            return this.lastValue
        } else {
            this.lastValue = await this.fn()
            this.lastAccess = Date.now()
            return this.lastValue
        }
    }
}
