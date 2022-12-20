import deepEqual from "deep-equal"


export class Subscription<T> implements AsyncIterator<T>, AsyncIterable<T> {
    private timer?: NodeJS.Timer
    private prev?: T
    private hasNoVal = true

    constructor(private interval: number, private poll: () => Promise<T>) {}

    [Symbol.asyncIterator]() {
        return this
    }

    async next() {
        if (this.hasNoVal) {
            this.prev = await this.poll()
            this.hasNoVal = false
            return {done: false, value: this.prev}
        }
        let value
        do {
            await new Promise<void>(resolve => {
                this.timer = setTimeout(() => {
                    this.timer = undefined
                    resolve()
                }, this.interval)
            })
            value = await this.poll()
        } while (deepEqual(this.prev, value))
        this.prev = value
        return {done: false, value}
    }

    async return() {
        if (this.timer != null) {
            clearTimeout(this.timer)
            this.timer = undefined
        }
        return EOS
    }
}


const EOS = {
    done: true,
    get value(): any {
        throw new Error('Unexpected value access')
    }
}
