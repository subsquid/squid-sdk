import {toHex} from "@subsquid/util-internal"

export class ProgressReporter {
    private window: {time: bigint, count: number}[] = []
    private count = 0
    private reportTimeout?: any
    private lastBlock = 0

    constructor(private total: number) {
        this.tick(0)
    }

    private tick(inc: number, time?: bigint): void {
        if (time == null) {
            time = process.hrtime.bigint()
        }
        this.count += inc
        this.window.push({
            time,
            count: this.count
        })
        if (this.window.length > 50) {
            this.window.shift()
        }
        if (this.reportTimeout == null) {
            this.scheduleReport()
        }
    }

    block(n: number): void {
        this.lastBlock = n
        this.tick(1)
    }

    private scheduleReport(): void {
        this.reportTimeout = setTimeout(() => {
            this.reportTimeout = undefined
            this.report()
        }, 5000)
    }

    report(): void {
        let percentage = Math.round(100 * this.count / this.total)
        let beg = this.window[0]
        let end = this.window[this.window.length - 1]
        let duration = end.time - beg.time
        let processed = end.count - beg.count
        if (processed == 0) return
        let eta = Number(BigInt(this.total - this.count) * duration / (BigInt(processed) * 1000_000_000n))
        console.log(`last block: ${this.lastBlock}, progress: ${percentage}%, eta: ${timeInterval(eta)}`)
        if (this.reportTimeout) {
            clearTimeout(this.reportTimeout)
            this.reportTimeout = undefined
        }
    }
}


function timeInterval(seconds: number): string {
    if (seconds < 60) {
        return seconds + 's'
    }
    let minutes = Math.ceil(seconds/60)
    if (minutes < 60) {
        return  minutes+'m'
    }
    let hours = Math.floor(minutes / 60)
    minutes = minutes - hours * 60
    return hours + 'h ' + minutes + 'm'
}


export function jsonReplacer(key: string, val: unknown): any {
    if (val instanceof Uint8Array) return toHex(val)
    if (typeof val == 'bigint') return val.toString()
    return val
}
