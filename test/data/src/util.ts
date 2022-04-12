import {Progress} from "@subsquid/util-internal-counters"


export class ProgressReporter {
    private progress: Progress
    private reportTimeout?: any

    constructor(total: number) {
        this.progress = new Progress()
        this.progress.setInitialValue(0)
        this.progress.setTargetValue(total)
    }

    tick(): void {
        this.progress.inc(1)
        if (this.reportTimeout == null) {
            this.scheduleReport()
        }
    }

    private scheduleReport(): void {
        this.reportTimeout = setTimeout(() => {
            this.reportTimeout = undefined
            this.report()
        }, 5000)
    }

    report(): void {
        let progress = Math.round(this.progress.ratio() * 100)
        console.log(`progress: ${progress}%, eta: ${timeInterval(this.progress.eta())}`)
        if (this.reportTimeout) {
            clearTimeout(this.reportTimeout)
            this.reportTimeout = undefined
        }
    }
}


function timeInterval(seconds: number): string {
    if (seconds < 60) {
        return Math.round(seconds) + 's'
    }
    let minutes = Math.ceil(seconds/60)
    if (minutes < 60) {
        return  minutes+'m'
    }
    let hours = Math.floor(minutes / 60)
    minutes = minutes - hours * 60
    return hours + 'h ' + minutes + 'm'
}
