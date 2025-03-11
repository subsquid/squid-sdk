import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Registry} from 'prom-client'


export class Metrics {
    readonly registry = new Registry()

    private hotBlocksLastBlockGauge: Gauge
    private hotBlocksFirstBlockGauge: Gauge
    private hotBlocksFinalizedBlockGauge: Gauge
    private hotBlocksStoredBlocksGauge: Gauge

    constructor() {
        this.hotBlocksLastBlockGauge = new Gauge({
            name: 'sqd_hotblocks_last_block',
            help: 'Number of the last stored block',
            registers: [this.registry],
        })

        this.hotBlocksFirstBlockGauge = new Gauge({
            name: 'sqd_hotblocks_first_block',
            help: 'Number of the first stored block',
            registers: [this.registry],
        })

        this.hotBlocksFinalizedBlockGauge = new Gauge({
            name: 'sqd_hotblocks_finalized_block',
            help: 'Number of the first stored block',
            registers: [this.registry],
        })

        this.hotBlocksStoredBlocksGauge = new Gauge({
            name: 'sqd_hotblocks_stored_blocks',
            help: 'Amount of stored blocks',
            registers: [this.registry],
        })

        collectDefaultMetrics({register: this.registry})
    }

    setLastBlock(value: number) {
        this.hotBlocksLastBlockGauge.set({}, value)
    }

    setFirstBlock(value: number) {
        this.hotBlocksFirstBlockGauge.set({}, value)
    }

    setStoredBlocks(value: number) {
        this.hotBlocksStoredBlocksGauge.set({}, value)
    }

    setFinalizedBlock(value: number) {
        this.hotBlocksFinalizedBlockGauge.set({datasource: 'finalized'}, value)
    }
}
