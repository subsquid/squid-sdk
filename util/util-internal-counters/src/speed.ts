import assert from "assert"


export class Speed {
    private window: {time: bigint, value: number}[] = []
    private value = 0
    private time = 0n
    private m?: bigint
    private windowSize = 50

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
        this.window.push({time: this.time, value: this.value})
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
}
