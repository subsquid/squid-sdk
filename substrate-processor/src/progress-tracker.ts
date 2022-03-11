import {getBlocksCount} from "./batch"
import {DataBatch} from "./ingest"
import {Prometheus} from "./prometheus"
import {Range} from "./util/range"


export class ProgressTracker {
    private window: {time: bigint, count: number}[] = []
    private ratio = 0
    private eta = 0

    constructor(
        private count: number,
        private wholeRange: {range: Range}[],
        private prometheus: Prometheus
    ) {
        this.tick(process.hrtime.bigint(), 0)
    }

    private tick(time: bigint, inc: number): bigint {
        this.count += inc
        this.window.push({
            time,
            count: this.count
        })
        if (this.window.length > 5) {
            this.window.shift()
        }
        return time
    }

    batch(time: bigint, batch: DataBatch): void {
        this.tick(time, batch.range.to - batch.range.from + 1)

        let total = getBlocksCount(this.wholeRange, this.prometheus.getChainHeight())
        this.ratio = Math.round(10000 * this.count / total) / 10000
        this.prometheus.setSyncRatio(this.ratio)

        let beg = this.window[0]
        let end = this.window[this.window.length - 1]
        let duration = end.time - beg.time
        let processed = end.count - beg.count
        this.eta = Number(BigInt(total - this.count) * duration / (BigInt(processed) * 1000_000_000n))
        this.prometheus.setSyncETA(this.eta)
    }

    getSyncRatio(): number {
        return this.ratio
    }

    getSyncEtaSeconds(): number {
        return this.eta
    }
}
