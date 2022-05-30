import {Progress, Speed} from "@subsquid/util-internal-counters"
import {createPrometheusServer, ListeningServer} from "@subsquid/util-internal-prometheus-server"
import {collectDefaultMetrics, Counter, Gauge, Registry} from "prom-client"


export class Metrics {
    private chainHeight = -1
    private ingestSpeed = new Speed(10)
    private mappingSpeed = new Speed(10)
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
        collect: this.collect(() => this.mappingSpeed.speed())
    })

    private ingestSpeedGauge = new Gauge({
        name: 'sqd_processor_ingest_blocks_per_second',
        help: 'Data fetching speed',
        registers: [this.registry],
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

    public readonly archiveHttpErrorsCounter = new Counter({
        name: 'sqd_processor_archive_http_errors',
        help: 'Number of archive http connection errors',
        registers: [this.registry],
        aggregator: 'sum',
        labelNames: ['archive']
    })

    public readonly archiveHttpErrorsInRowGauge = new Gauge({
        name: 'sqd_processor_archive_http_errors_in_row',
        help: 'Number of archive http connection errors happened in row, without single successful request',
        registers: [this.registry],
        aggregator: 'sum',
        labelNames: ['archive']
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

    updateProgress(
        chainHeight: number,
        estimatedTotalBlocksCount: number,
        estimatedBlocksLeft: number,
        time?: bigint
    ): void {
        this.setChainHeight(chainHeight)
        this.blockProgress.setTargetValue(estimatedTotalBlocksCount)
        this.blockProgress.setCurrentValue(estimatedTotalBlocksCount - estimatedBlocksLeft, time)
    }

    registerBatch(
        batchSize: number,
        batchFetchTime: bigint,
        batchMappingStartTime: bigint,
        batchMappingEndTime: bigint,
    ): void {
        this.ingestSpeed.push(batchSize, batchFetchTime)
        this.mappingSpeed.push(batchSize, batchMappingEndTime - batchMappingStartTime)
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

    serve(port: number | string): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, port)
    }
}
