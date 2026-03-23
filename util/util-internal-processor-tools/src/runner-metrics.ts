import {Progress, Speed} from '@subsquid/util-internal-counters'
import {assertRangeList, FiniteRange, getSize, Range} from '@subsquid/util-internal-range'
import {timeInterval} from './util'


export class RunnerMetrics {
    private chainHeight = -1
    private lastBlock = -1
    private mappingSpeed = new Speed({windowSize: 5})
    private mappingItemSpeed = new Speed({windowSize: 5})
    private blockProgress = new Progress({initialValue: 0})
    private blocksCountInRange: (range: FiniteRange) => number

    constructor(requests: {range: Range}[])
    constructor(blocksCountInRange: (range: FiniteRange) => number)
    constructor(requestsOrCounter: {range: Range}[] | ((range: FiniteRange) => number)) {
        if (typeof requestsOrCounter === 'function') {
            this.blocksCountInRange = requestsOrCounter
        } else {
            let ranges = requestsOrCounter.map(r => r.range)
            assertRangeList(ranges)
            this.blocksCountInRange = range => getSize(ranges, range)
        }
    }

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

    private get head(): number {
        return Math.max(this.chainHeight, this.lastBlock, 0)
    }

    getEstimatedTotalBlocksCount(): number {
        return this.blocksCountInRange({from: 0, to: this.head})
    }

    getEstimatedBlocksLeft(): number {
        let count = this.blocksCountInRange({from: Math.max(this.lastBlock, 0), to: this.head})
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
