import assert from 'assert'


export class RateMeter {
    private window: number[]
    private time = 0

    constructor() {
        this.window = new Array(11)
        this.window.fill(0)
    }

    inc(count: number, now?: number): void {
        now = this.toTime(now)
        let cutoff = now - this.window.length
        if (this.time > cutoff) {
            while (cutoff > this.time - this.window.length) {
                this.window[cutoff % this.window.length] = 0
                cutoff -= 1
            }
        } else {
            this.window.fill(0)
        }
        this.window[now % this.window.length] += count
        this.time = now
    }

    getRate(now?: number): number {
        now = this.toTime(now)
        let cutoff = now - this.window.length
        let time = this.time
        let rate = 0
        while (time > cutoff) {
            rate += this.window[time % this.window.length]
            time -= 1
        }
        return rate
    }

    private toTime(now?: number): number {
        now = now ?? Date.now()
        let time = Math.ceil(now / 100)
        time = Math.max(time, this.time)
        assert(time > this.window.length)
        return time
    }
}
