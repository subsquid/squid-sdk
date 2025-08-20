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
            buckets: [100, 200, 500, 1000, 2000, 5000, 10000, 15000, 20000, 30000, 60000, 300000, 600000, 1200000, 3600000],
            registers: [this.registry],
        })

        this.blockProcessingTimeHistogram = new Histogram({
            name: 'sqd_hotblocks_processing_time_ms',
            help: 'Time taken to process a block in milliseconds',
            buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
            registers: [this.registry]
        });

        collectDefaultMetrics({register: this.registry})
    }

    setLastBlock(value: number) {
        this.hotBlocksLastBlockGauge.set(value)
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

    trackProcessingTime(startTime: number) {
        const duration = Date.now() - startTime;
        this.blockProcessingTimeHistogram.observe(duration);
    }
}

class BlockTimestampCache {
    private cache = new Map<string, number>();
    private maxSize: number;
    private ttlMs: number;
  
    constructor(maxSize = 1000, ttlMs = 30 * 60 * 1000) {
      this.maxSize = maxSize;
      this.ttlMs = ttlMs;
    }
  
    private getKey(height: string): string {
      return `${height}`;
    }
  
    set(height: string, timestamp: number): void {
      const key = this.getKey(height);
      
      if (this.cache.size >= this.maxSize) {
        let oldestKey = '';
        let oldestTime = Infinity;
        
        for (const [k, time] of this.cache.entries()) {
          if (time < oldestTime) {
            oldestTime = time;
            oldestKey = k;
          }
        }
        
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
      
      this.cache.set(key, timestamp);
      
      setTimeout(() => {
        this.cache.delete(key);
      }, this.ttlMs);
    }
  
    get(height: string): number | undefined {
      const key = this.getKey(height);
      return this.cache.get(key);
    }
  }
  
  export const blockTimestampCache = new BlockTimestampCache();
  
  export function recordBlockIngestion(block: Block) {
    const now = Date.now();
    blockTimestampCache.set(
      block.number.toString(),
      now
    );
  }
  
  export function getBlockIngestionTimestamp(height: string): number | undefined {
    return blockTimestampCache.get(height);
  }
  