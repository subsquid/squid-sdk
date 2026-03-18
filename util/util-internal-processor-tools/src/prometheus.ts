import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Registry} from 'prom-client'
import {RunnerMetrics} from './runner-metrics'


interface ConnectionMetrics {
    url: string
    requestsServed: number
    connectionErrors: number
}

export interface MetricsSink {
    register(registry: Registry): void
}

type StartHookType = (registry: Registry) => Promise<void> | void;

export class PrometheusServer {
    private registry = new Registry()
    private port?: number | string
    private metricSinks: MetricsSink[] = [];

    constructor() {
        collectDefaultMetrics({ register: this.registry })
    }

    addMetricsSink(sink: MetricsSink) {
        this.metricSinks.push(sink);
    }

    setPort(port: number | string): void {
        this.port = port
    }

    addRunnerMetrics(metrics: RunnerMetrics): void {
        new Gauge({
            name: 'sqd_processor_chain_height',
            help: 'Chain height of the data source',
            registers: [this.registry],
            collect: collect(() => metrics.getChainHeight())
        })

        new Gauge({
            name: 'sqd_processor_last_block',
            help: 'Last processed block',
            registers: [this.registry],
            collect: collect(() => metrics.getLastProcessedBlock())
        })

        new Gauge({
            name: 'sqd_processor_mapping_blocks_per_second',
            help: 'Mapping performance',
            registers: [this.registry],
            collect: collect(() => metrics.getMappingSpeed())
        })

        new Gauge({
            name: 'sqd_processor_sync_eta_seconds',
            help: 'Estimated time until all required blocks will be processed or until the chain height will be reached',
            registers: [this.registry],
            collect: collect(() => metrics.getSyncEtaSeconds())
        })

        new Gauge({
            name: 'sqd_processor_sync_ratio',
            help: 'Percentage of processed blocks',
            registers: [this.registry],
            collect: collect(() => metrics.getSyncRatio())
        })
    }

    addChainRpcMetrics(collect: () => ConnectionMetrics): void {
        new Gauge({
            name: 'sqd_rpc_request_count',
            help: 'Number of rpc requests made',
            labelNames: ['url', 'kind'],
            registers: [this.registry],
            collect() {
                let m = collect()
                this.set({url: m.url, kind: 'success'}, m.requestsServed)
                this.set({url: m.url, kind: 'failure'}, m.connectionErrors)
            }
        })
    }

    async serve(): Promise<ListeningServer> {
        await Promise.all(this.metricSinks.map(sink => sink.register(this.registry)))
        return createPrometheusServer(this.registry, this.getPort())
    }

    private getPort(): number | string {
        return this.port == null
            ? process.env.PROCESSOR_PROMETHEUS_PORT || process.env.PROMETHEUS_PORT || 0
            : this.port
    }
}


function collect(fn: () => number) {
    return function(this: Gauge<string>) {
        this.set(fn())
    }
}
