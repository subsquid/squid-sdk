import {collectDefaultMetrics, Counter, Gauge, Histogram, register, Registry} from 'prom-client'
import { Block } from './types';

export class Metrics {
    readonly registry = new Registry()

    private hotBlocksLastBlockGauge: Gauge
    private hotBlocksLastBlockLagGauge: Gauge
    private hotBlocksFirstBlockGauge: Gauge
    private hotBlocksFinalizedBlockGauge: Gauge
    private hotBlocksStoredBlocksGauge: Gauge
    private blockLagHistogram: Histogram
    private blockProcessingTimeHistogram: Histogram
    private blockIngestionTimestamp: Gauge

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

        this.blockLagHistogram = new Histogram({
            name: 'sqd_hotblocks_block_lag_ms',
            help: 'Time to process a block from creation to end of processing in ms',
            buckets: [50, 100, 200, 300, 400, 500, 750, 1000, 2000],
            registers: [this.registry],
        })

        this.blockProcessingTimeHistogram = new Histogram({
            name: 'block_processing_duration_seconds',
            help: 'Time taken to process a block in seconds',
            labelNames: ['dataset', 'network'],
            buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry]
        });
  
        this.blockIngestionTimestamp = new Gauge({
            name: 'block_ingestion_timestamp',
            help: 'Timestamp (in milliseconds since epoch) when the block was received by the ingestion service',
            labelNames: ['dataset', 'network', 'blockHeight', 'blockHash'],
            registers: [this.registry]
        });

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

    observeBlockLag(blockTimestamp: number) {
        if (blockTimestamp === 0) return;

        const processingLag = Date.now() - blockTimestamp;
        this.blockLagHistogram.observe(processingLag);
    }

    recordBlockIngestion(block: Block, dataset: string, network: string) {
        const now = Date.now();
        this.blockIngestionTimestamp.labels({
          dataset,
          network,
          blockHeight: block.number.toString(),
          blockHash: block.hash
        }).set(now);
    }

    trackProcessingTime(startTime: number, dataset: string, network: string) {
        const duration = (Date.now() - startTime) / 1000;
        this.blockProcessingTimeHistogram.labels({
          dataset,
          network
        }).observe(duration);
    }
}
