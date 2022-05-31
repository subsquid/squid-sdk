import assert from "assert"


export class Speed {
    private size: number
    private window: {time: bigint, value: number}[] = [{time: 0n, value: 0}]
    private tail = 1
    private value = 0
    private time = 0n
    private m?: bigint

    constructor(windowSize = 50) {
        assert(windowSize > 0)
        this.size = windowSize + 1
    }

    start(time?: bigint): void {
        this.m = time ?? process.hrtime.bigint()
    }

    stop(val: number, time?: bigint): bigint {
        assert(this.m != null, 'mark should be set')
        time = time ?? process.hrtime.bigint()
        if (time <= this.m) return 0n
        let duration = time - this.m
        this.push(val, duration)
        return duration
    }

    push(val: number, duration: bigint): void {
        this.time += duration
        this.m = undefined
        this.value += val
        this.window[this.tail] = {time: this.time, value: this.value}
        this.tail = (this.tail + 1) % this.size
    }

    speed(): number {
        if (this.window.length < 2) return 0
        let beg = this.window.length < this.size ? this.window[0] : this.window[this.tail]
        let end = this.window[(this.size + this.tail - 1) % this.size]
        let duration = end.time - beg.time
        let inc = end.value - beg.value
        return inc * 1000_000_000 / Number(duration)
    }
}
