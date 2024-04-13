import {Progress, Speed} from '@subsquid/util-internal-counters'
import {Gauge} from 'prom-client'
import {timeInterval} from './util'


export class Metrics {
    private chainHeight = -1
    private lastBlock = -1
    private mappingSpeed = new Speed({windowSize: 5})
    private mappingItemSpeed = new Speed({windowSize: 5})
    private blockProgress = new Progress({initialValue: 0, windowSize: 5})

    setChainHeight(height: number): void {
        this.chainHeight = Math.max(height, this.lastBlock)
    }

    setLastProcessedBlock(height: number): void {
        this.lastBlock = height
        this.chainHeight = Math.max(this.chainHeight, this.lastBlock)
    }

    updateProgress(processed: number, left: number, time?: bigint): void {
        this.blockProgress.setTargetValue(processed + left)
        this.blockProgress.setCurrentValue(processed, time)
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

    install(): void {
        new Gauge({
            name: 'sqd_processor_chain_height',
            help: 'Chain height of the data source',
            collect: collect(() => this.getChainHeight())
        })

        new Gauge({
            name: 'sqd_processor_last_block',
            help: 'Last processed block',
            collect: collect(() => this.getLastProcessedBlock())
        })

        new Gauge({
            name: 'sqd_processor_mapping_blocks_per_second',
            help: 'Mapping performance',
            collect: collect(() => this.getMappingSpeed())
        })

        new Gauge({
            name: 'sqd_processor_sync_eta_seconds',
            help: 'Estimated time until all required blocks will be processed or until the chain height will be reached',
            collect: collect(() => this.getSyncEtaSeconds())
        })

        new Gauge({
            name: 'sqd_processor_sync_ratio',
            help: 'Percentage of processed blocks',
            collect: collect(() => this.getSyncRatio())
        })
    }
}


function collect(fn: () => number) {
    return function(this: Gauge<string>) {
        this.set(fn())
    }
}
