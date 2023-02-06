import assert from "assert"


interface Rec {
    value: number
    time: bigint
    duration: bigint
}


export interface SpeedOptions {
    windowSize?: number
    windowGranularitySeconds?: number
}


export class Speed {
    private size: number
    private granularity
    private window: Rec[] = [{value: 0, time: 0n, duration: 0n}]
    private tail = 1
    private value = 0
    private duration = 0n
    private m?: bigint

    constructor(options?: SpeedOptions) {
        let windowSize = options?.windowSize ?? 50
        let windowGranularitySeconds = options?.windowGranularitySeconds ?? 0
        assert(windowSize > 0)
        assert(windowGranularitySeconds >= 0)
        this.size = windowSize + 1
        this.granularity = BigInt(windowGranularitySeconds) * 1_000_000_000n
    }

    start(time?: bigint): void {
        this.m = time ?? process.hrtime.bigint()
    }

    stop(val: number, time?: bigint): bigint {
        assert(this.m != null, 'mark should be set')
        let beg = this.m
        this.m = undefined
        let end = time ?? process.hrtime.bigint()
        if (end <= beg) return 0n
        this.push(val, beg, end)
        return end - beg
    }

    push(val: number, beg: bigint, end: bigint): void {
        this.duration += end - beg
        this.value += val
        let last = this.window[(this.size + this.tail - 1) % this.size]
        if (this.window.length > 1 && last.time + this.granularity >= end) {
            last.value = this.value
            last.duration = this.duration
        } else {
            this.window[this.tail] = {value: this.value, duration: this.duration, time: end}
            this.tail = (this.tail + 1) % this.size
        }
    }

    speed(): number {
        if (this.window.length < 2) return 0
        let beg = this.window.length < this.size ? this.window[0] : this.window[this.tail]
        let end = this.window[(this.size + this.tail - 1) % this.size]
        let duration = end.duration - beg.duration
        let inc = end.value - beg.value
        return inc * 1000_000_000 / Number(duration)
    }

    time(): number {
        let speed = this.speed()
        return speed == 0 ? 0 : 1/speed
    }
}
