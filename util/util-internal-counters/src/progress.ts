import assert from "assert"


export interface ProgressOptions {
    initialValue?: number
    targetValue?: number
    windowSize?: number
    windowGranularitySeconds?: number
}


export class Progress {
    private size: number
    private granularity: bigint
    private window: {time: bigint, value: number}[] = []
    private tail = 0
    private initialValue?: number
    private targetValue?: number
    private _hasNews = false

    constructor(options?: ProgressOptions) {
        let windowSize = options?.windowSize ?? 50
        let windowGranularitySeconds = options?.windowGranularitySeconds ?? 0
        assert(windowSize > 1)
        assert(windowGranularitySeconds >= 0)
        this.size = windowSize + 1
        this.granularity = BigInt(windowGranularitySeconds) * 1_000_000_000n
        this.initialValue = options?.initialValue
        this.targetValue = options?.targetValue
    }

    setInitialValue(value: number): void {
        this.initialValue = value
    }

    setTargetValue(value: number): void {
        this.targetValue = value
    }

    setCurrentValue(value: number, time?: bigint): void {
        time = time ?? process.hrtime.bigint()

        if (this.window.length == 0) {
            this.window[0] = {value, time}
            this.tail = 1
            return
        }

        let last = this.last()
        value = Math.max(value, last.value)
        if (time <= last.time) {
            last.value = value
        } else if (this.window.length > 1 && time <= last.time + this.granularity) {
            last.value = value
        } else {
            this.window[this.tail] = {value, time}
            this.tail = (this.tail + 1) % this.size
        }
        this._hasNews = true
    }

    private last(): {value: number, time: bigint} {
        assert(this.window.length > 0)
        return this.window[(this.size + this.tail - 1) % this.size]
    }

    getCurrentValue(): number {
        assert(this.window.length > 0, 'no current value available')
        return this.last().value
    }

    speed(): number {
        this._hasNews = false
        if (this.window.length < 2) return 0
        let beg = this.window.length < this.size ? this.window[0] : this.window[this.tail]
        let end = this.last()
        let duration = end.time - beg.time
        let inc = end.value - beg.value
        return inc * 1000_000_000 / Number(duration)
    }

    eta(): number {
        this._hasNews = false
        if (this.targetValue == null) return 0
        let speed = this.speed()
        if (speed == 0) return 0
        let last = this.last()
        let left = this.targetValue - Math.min(this.targetValue, last.value)
        return left / speed
    }

    ratio(): number {
        this._hasNews = false
        if (this.targetValue == null || this.initialValue == null || this.window.length == 1) return 0
        let distance = Math.max(this.targetValue, this.initialValue) - this.initialValue
        if (distance <= 0) return 1
        let pos = Math.max(this.getCurrentValue(), this.initialValue) - this.initialValue
        return Math.min(pos, distance) / distance
    }

    hasNews(): boolean {
        return this._hasNews
    }
}
