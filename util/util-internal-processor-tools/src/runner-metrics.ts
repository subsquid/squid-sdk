import {Progress, Speed} from '@subsquid/util-internal-counters'
import {getBlocksCount} from './batch'
import {Range} from './range'
import {timeInterval} from './util'


export class RunnerMetrics {
    private chainHeight = -1
    private lastBlock = -1
    private ingestSpeed = new Speed({windowSize: 5})
    private mappingSpeed = new Speed({windowSize: 5})
    private mappingItemSpeed = new Speed({windowSize: 5})
    private blockProgress = new Progress({initialValue: 0})

    constructor(private requests: {range: Range}[]) {}

    setChainHeight(height: number): void {
        this.chainHeight = height
    }

    setLastProcessedBlock(height: number): void {
        this.lastBlock = height
    }

    updateProgress(time?: bigint): void {
        let total = this.getEstimatedTotalBlocksCount()
        this.blockProgress.setTargetValue(total)
        this.blockProgress.setCurrentValue(total - this.getEstimatedBlocksLeft(), time)
    }

    registerBatch(
        batchSize: number,
        batchItemSize: number,
        batchFetchStartTime: bigint,
        batchFetchEndTime: bigint,
        batchMappingStartTime: bigint,
        batchMappingEndTime: bigint,
    ): void {
        this.ingestSpeed.push(batchSize, batchFetchStartTime, batchFetchEndTime)
        this.mappingSpeed.push(batchSize, batchMappingStartTime, batchMappingEndTime)
        this.mappingItemSpeed.push(batchItemSize || 1, batchMappingStartTime, batchMappingEndTime)
    }

    getEstimatedTotalBlocksCount(): number {
        return getBlocksCount(this.requests, 0,  Math.max(this.chainHeight, this.lastBlock))
    }

    getEstimatedBlocksLeft(): number {
        let count = getBlocksCount(this.requests, this.lastBlock, Math.max(this.chainHeight, this.lastBlock))
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

    getIngestSpeed(): number {
        return this.ingestSpeed.speed()
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
        `ingest: ${Math.round(this.getIngestSpeed())} blocks/sec, ` +
        `eta: ${timeInterval(this.getSyncEtaSeconds())}`
    }
}
