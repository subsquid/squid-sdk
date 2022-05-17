import assert from "assert"


export class Speed {
    private window: {time: bigint, value: number}[] = []
    private tail = 0
    private value = 0
    private time = 0n
    private m?: bigint

    constructor(private readonly windowSize = 50) {
        assert(this.windowSize > 0)
    }

    start(time?: bigint): void {
        this.m = time ?? process.hrtime.bigint()
    }

    stop(val: number, time?: bigint): void {
        assert(this.m != null, 'mark should be set')
        time = time ?? process.hrtime.bigint()
        if (time <= this.m) return
        this.time += time - this.m
        this.m = undefined
        this.value += val
        this.window[this.tail] = {time: this.time, value: this.value}
        this.tail = (this.tail + 1) % this.windowSize
    }

    speed(): number {
        if (this.window.length < 2) return 0
        let beg = this.window.length < this.windowSize ? this.window[0] : this.window[this.tail]
        let end = this.window[(this.windowSize + this.tail - 1) % this.windowSize]
        let duration = end.time - beg.time
        let inc = end.value - beg.value
        return inc * 1000_000_000 / Number(duration)
    }
}
