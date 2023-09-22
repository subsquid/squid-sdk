import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import promClient, { collectDefaultMetrics, Gauge, Registry } from 'prom-client';


export class PrometheusServer {
    private registry = new Registry()
    private port?: number | string
    private lastBlockGauge: Gauge;
    private lastSavedBlockGauge: Gauge;

    constructor(port: number) {
        this.port = port;
        this.lastBlockGauge = new Gauge({
            name: 'sqd_last_block_total',
            help: 'Last block available in the chain',
            registers: [this.registry]
        });

        this.lastSavedBlockGauge = new Gauge({
            name: 'sqd_last_saved_block_total',
            help: 'Last saved block',
            registers: [this.registry]
        });

        collectDefaultMetrics({register: this.registry})
    }

    setLastBlock(block: number) {
        this.lastBlockGauge.set(block);
    }

    setLastSavedBlock(block: number) {
        this.lastSavedBlockGauge.set(block);
    }

    private getPort(): number | string {
        return this.port == null
            ? process.env.PROMETHEUS_PORT || 0
            : this.port
    }


    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.getPort())
    }
}
