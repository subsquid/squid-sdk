import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Registry} from 'prom-client'


export class PrometheusServer {
    private registry = new Registry()
    private hotBlocksLastBlockGauge: Gauge
    private hotBlocksFirstBlockGouage: Gauge
    private hotBlocksStoredBlocks: Gauge

    constructor(
        private port: number,
    ) {
        this.hotBlocksLastBlockGauge = new Gauge({
            name: 'sqd_hotblocks_last_block',
            help: 'Number of the last stored block',
            labelNames: ['datasource'],
            registers: [this.registry],
        })

        this.hotBlocksFirstBlockGouage = new Gauge({
            name: 'sqd_hotblocks_first_block',
            help: 'Number of the first stored block',
            labelNames: ['datasource'],
            registers: [this.registry],
        })

        this.hotBlocksStoredBlocks = new Gauge({
            name: 'sqd_hotblocks_stored_blocks',
            help: 'Amount of stored blocks',
            labelNames: ['datasource'],
            registers: [this.registry],
        })

        collectDefaultMetrics({register: this.registry})
    }

    setLastBlock(value: number) {
        this.hotBlocksLastBlockGauge.set({}, value)
    }

    setFirstBlock(value: number) {
        this.hotBlocksFirstBlockGouage.set({}, value)
    }

    setStoredBlocks(value: number) {
        this.hotBlocksStoredBlocks.set({}, value)
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
