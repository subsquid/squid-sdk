import {Progress, Speed} from "@subsquid/util-internal-counters"
import {createPrometheusServer, ListeningServer} from "@subsquid/util-internal-prometheus-server"
import {collectDefaultMetrics, Gauge, Registry} from "prom-client"
import type {IngestMetrics} from "./ingest"


export class Metrics implements IngestMetrics {
    private chainHeight = -1
    private ingestSpeed = new Speed()
    private mappingSpeed = new Speed()
    private blockProgress = new Progress()
    private registry = new Registry()

    private lastBlockGauge = new Gauge({
        name: 'sqd_processor_last_block',
        help: 'Last processed block',
        registers: [this.registry],
        aggregator: 'max'
    })

    private chainHeightGauge = new Gauge({
        name: 'sqd_processor_chain_height',
        help: 'Chain height of the data source',
        registers: [this.registry],
        aggregator: 'max',
        collect: this.collect(() => this.chainHeight)
    })

    private mappingSpeedGauge = new Gauge({
        name: 'sqd_processor_mapping_blocks_per_second',
        help: 'Mapping performance',
        registers: [this.registry],
        aggregator: 'average',
        collect: this.collect(() => this.mappingSpeed.speed())
    })

    private ingestSpeedGauge = new Gauge({
        name: 'sqd_processor_ingest_blocks_per_second',
        help: 'Data fetching speed',
        registers: [this.registry],
        aggregator: 'average',
        collect: this.collect(() => this.ingestSpeed.speed())
    })

    private syncEtaGauge = new Gauge({
        name: 'sqd_processor_sync_eta_seconds',
        help: 'Estimated time until all required blocks will be processed or until chain height will be reached',
        registers: [this.registry],
        collect: this.collect(() => this.blockProgress.eta())
    })

    private syncRatioGauge = new Gauge({
        name: 'sqd_processor_sync_ratio',
        help: 'Percentage of processed blocks',
        registers: [this.registry],
        aggregator: 'max',
        collect: this.collect(() => this.blockProgress.ratio())
    })

    private collect(fn: () => number) {
        return function(this: Gauge<string>) {
            this.set(fn())
        }
    }

    constructor() {
        collectDefaultMetrics({register: this.registry})
        this.setLastProcessedBlock(-1)
        this.setChainHeight(-1)
        this.blockProgress.setInitialValue(0)
    }

    setLastProcessedBlock(height: number): void {
        this.lastBlockGauge.set(height)
    }

    setChainHeight(height: number): void {
        this.chainHeight = height
    }

    setProgress(blocksProcessedSoFar: number, time?: bigint): void {
        this.blockProgress.setCurrentValue(blocksProcessedSoFar, time)
    }

    setTotalNumberOfBlocks(blocksCount: number): void {
        this.blockProgress.setTargetValue(blocksCount)
    }

    batchProcessingTime(start: bigint, end: bigint, processedBlocksCount: number): void {
        this.mappingSpeed.start(start)
        this.mappingSpeed.stop(processedBlocksCount, end)
    }

    batchRequestTime(start: bigint, end: bigint, fetchedBlocksCount: number) {
        this.ingestSpeed.start(start)
        this.ingestSpeed.stop(fetchedBlocksCount, end)
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

    getChainHeight(): number {
        return this.chainHeight
    }

    serve(port: number | string): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, port)
    }
}
