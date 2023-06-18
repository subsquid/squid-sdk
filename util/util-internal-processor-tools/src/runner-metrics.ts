import {def} from '@subsquid/util-internal'
import {Progress, Speed} from '@subsquid/util-internal-counters'
import {assertRangeList, getSize, Range, RangeList} from '@subsquid/util-internal-range'
import {timeInterval} from './util'


export class RunnerMetrics {
    private chainHeight = -1
    private lastBlock = -1
    private mappingSpeed = new Speed({windowSize: 5})
    private mappingItemSpeed = new Speed({windowSize: 5})
    private blockProgress = new Progress({initialValue: 0})

    constructor(private requests: {range: Range}[]) {}

    setChainHeight(height: number): void {
        this.chainHeight = Math.max(height, this.lastBlock)
    }

    setLastProcessedBlock(height: number): void {
        this.lastBlock = height
        this.chainHeight = Math.max(this.chainHeight, this.lastBlock)
    }

    updateProgress(time?: bigint): void {
        let total = this.getEstimatedTotalBlocksCount()
        this.blockProgress.setTargetValue(total)
        this.blockProgress.setCurrentValue(total - this.getEstimatedBlocksLeft(), time)
    }

    registerBatch(
        batchSize: number,
        batchItemSize: number,
        batchMappingStartTime: bigint,
        batchMappingEndTime: bigint,
    ): void {
        this.mappingSpeed.push(batchSize, batchMappingStartTime, batchMappingEndTime)
        this.mappingItemSpeed.push(batchItemSize || 1, batchMappingStartTime, batchMappingEndTime)
    }

    @def
    private getRequestedBlockRanges(): RangeList {
        let ranges = this.requests.map(req => req.range)
        assertRangeList(ranges)
        return ranges
    }

    getEstimatedTotalBlocksCount(): number {
        return getSize(this.getRequestedBlockRanges(), {
            from: 0,
            to: Math.max(this.chainHeight, this.lastBlock)
        })
    }

    getEstimatedBlocksLeft(): number {
        let count = getSize(this.getRequestedBlockRanges(), {
            from: this.lastBlock,
            to: Math.max(this.chainHeight, this.lastBlock)
        })
        return count == 1 ? 0 : count
    }

    getChainHeight(): number {
        return this.chainHeight
    }

    getLastProcessedBlock(): number {
        return this.lastBlock
    }

    getSyncSpeed(): number {
        return this.blockProgress.speed()
    }

    getSyncEtaSeconds(): number {
        return this.blockProgress.eta()
    }

    getSyncRatio(): number {
        return this.blockProgress.ratio()
    }

    getMappingSpeed(): number {
        return this.mappingSpeed.speed()
    }

    getMappingItemSpeed(): number {
        return this.mappingItemSpeed.speed()
    }

    getStatusLine(): string {
        return `${this.lastBlock} / ${this.chainHeight}, ` +
        `rate: ${Math.round(this.getSyncSpeed())} blocks/sec, ` +
        `mapping: ${Math.round(this.getMappingSpeed())} blocks/sec, ` +
        `${Math.round(this.getMappingItemSpeed())} items/sec, ` +
        `eta: ${timeInterval(this.getSyncEtaSeconds())}`
    }
}
