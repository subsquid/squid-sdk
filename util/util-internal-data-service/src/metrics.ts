import {collectDefaultMetrics, Counter, Gauge, Histogram, Registry} from 'prom-client'


export class Metrics {
    readonly registry = new Registry()

    private hotBlocksLastBlockGauge: Gauge
    private hotBlocksLastBlockLagGauge: Gauge
    private hotBlocksFirstBlockGauge: Gauge
    private hotBlocksFinalizedBlockGauge: Gauge
    private hotBlocksStoredBlocksGauge: Gauge
    private blockProcessingTimeHistogram: Histogram
    private blocksSLOSuccessCounter: Counter
    private blocksSLOFailureCounter: Counter

    constructor() {
        this.hotBlocksLastBlockGauge = new Gauge({
            name: 'sqd_hotblocks_last_block',
            help: 'Number of the last stored block',
            registers: [this.registry],
        })

        this.hotBlocksLastBlockLagGauge = new Gauge({
            name: 'sqd_hotblocks_last_block_lag_ms',
            help: 'Lag of the last stored block in ms',
            registers: [this.registry],
        })

        this.hotBlocksFirstBlockGauge = new Gauge({
            name: 'sqd_hotblocks_first_block',
            help: 'Number of the first stored block',
            registers: [this.registry],
        })

        this.hotBlocksFinalizedBlockGauge = new Gauge({
            name: 'sqd_hotblocks_finalized_block',
            help: 'Number of the finalized stored block',
            registers: [this.registry],
        })

        this.hotBlocksStoredBlocksGauge = new Gauge({
            name: 'sqd_hotblocks_stored_blocks',
            help: 'Amount of stored blocks',
            registers: [this.registry],
        })

        this.blockProcessingTimeHistogram = new Histogram({
            name: 'sqd_hotblocks_processing_time_ms',
            help: 'Time to process a block from creation to database availability in ms',
            buckets: [50, 100, 200, 300, 400, 500, 750, 1000, 2000],
            registers: [this.registry],
        })

        this.blocksSLOSuccessCounter = new Counter({
            name: 'sqd_hotblocks_slo_success_total',
            help: 'Number of blocks processed within SLO (500ms)',
            registers: [this.registry],
        })
        
        this.blocksSLOFailureCounter = new Counter({
            name: 'sqd_hotblocks_slo_failure_total',
            help: 'Number of blocks processed outside SLO (>500ms)',
            registers: [this.registry],
        })

        collectDefaultMetrics({register: this.registry})
    }

    setLastBlock(value: number) {
        this.hotBlocksLastBlockGauge.set({}, value)
    }

    setLastBlockTimestamp(value: number) {
        if (value === 0) {
            this.hotBlocksLastBlockLagGauge.set({}, -1)
        } else {
            this.hotBlocksLastBlockLagGauge.set({}, Date.now() - value)
        }
    }

    setFirstBlock(value: number) {
        this.hotBlocksFirstBlockGauge.set({}, value)
    }

    setStoredBlocks(value: number) {
        this.hotBlocksStoredBlocksGauge.set({}, value)
    }

    setFinalizedBlock(value: number) {
        this.hotBlocksFinalizedBlockGauge.set({}, value)
    }

    observeBlockProcessingTime(blockTimestamp: number) {
        if (blockTimestamp === 0) return;
        
        const processingTime = Date.now() - blockTimestamp;
        this.blockProcessingTimeHistogram.observe(processingTime);
        
        if (processingTime <= 500) {
            this.blocksSLOSuccessCounter.inc();
        } else {
            this.blocksSLOFailureCounter.inc();
        }
    }
}
