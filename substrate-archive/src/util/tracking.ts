import assert from "assert"


export class ProgressTracker {
    private window: {time: bigint, value: number}[] = []
    private value = 0

    abs(val: number, time?: bigint): void {
        assert(this.value <= val)
        this.value = val
        this.tick(time)
    }

    inc(val: number, time?: bigint): void {
        this.value += val
        this.tick(time)
    }

    tick(time?: bigint): void {
        time = time ?? process.hrtime.bigint()
        this.window.push({time, value: this.value})
        if (this.window.length > 50) {
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
}


export class SpeedTracker {
    private window: {time: bigint, value: number}[] = []
    private value = 0
    private time = 0n
    private m?: bigint

    mark(time?: bigint): void {
        this.m = time ?? process.hrtime.bigint()
    }

    inc(val: number, time?: bigint): void {
        assert(this.m != null, 'mark should be set')
        time = time ?? process.hrtime.bigint()
        this.time += time - this.m
        this.m = undefined
        this.value += val
        this.window.push({time: this.time, value: this.value})
        if (this.window.length > 50) {
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
}


export function round(decimals: number, val: number): number {
    let m = Math.pow(10, decimals)
    return Math.round(val * m) / m
}
