import assert from "assert"


export class Progress {
    private window: {time: bigint, value: number}[] = []
    private value = 0
    private targetValue?: number
    private initialValue?: number
    private windowSize = 50
    private windowGranularity = 10_000_000_000n // 10 seconds

    setTargetValue(val: number): void {
        this.targetValue = val
    }

    setInitialValue(val: number): void {
        this.initialValue = val
    }

    setCurrentValue(val: number, time?: bigint): void {
        this.value = Math.max(this.value, val)
        this.tick(time)
    }

    getCurrentValue(): number {
        return this.value
    }

    inc(val: number, time?: bigint): void {
        assert(val > 0)
        this.value += val
        this.tick(time)
    }

    tick(time?: bigint): void {
        time = time ?? process.hrtime.bigint()
        let last = this.window[this.window.length - 1] || {time, value: this.value}
        time = last.time > time ? last.time : time
        if (this.window.length > 2 && time - this.window[this.window.length - 2].time < this.windowGranularity) {
            last.time = time
            last.value = this.value
        } else {
            this.window.push({time, value: this.value})
        }
        if (this.window.length > this.windowSize) {
            this.window.shift()
        }
    }

    speed(): number {
        if (this.window.length < 2) return 0
        let beg = this.window[0]
        let end = this.window[this.window.length - 1]
        let duration = end.time - beg.time
        let inc = end.value - beg.value
        return inc * 1000_000_000 / Number(duration)
    }

    eta(): number {
        if (this.targetValue == null) return 0
        let left = this.targetValue - Math.min(this.targetValue, this.value)
        return left / this.speed()
    }

    ratio(): number {
        if (this.targetValue == null || this.initialValue == null) return 0
        let distance = Math.max(this.targetValue, this.initialValue) - this.initialValue
        let pos = Math.max(this.value, this.initialValue) - this.initialValue
        return pos == 0 ? 0 : pos/distance
    }
}
