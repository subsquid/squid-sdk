import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Counter, Gauge, Registry} from 'prom-client'
import {RunnerMetrics} from './runner-metrics'


interface RpcConnectionMetrics {
    id: number
    url: string
    avgResponseTimeSeconds: number
    requestsServed: number
    connectionErrors: number
}


export class PrometheusServer {
    private registry = new Registry()
    private port?: number | string

    private archiveErrorsCounter = new Counter({
        name: 'sqd_processor_archive_errors',
        help: 'Number of archive connection errors',
        registers: [this.registry],
        labelNames: ['url']
    })

    constructor() {
        collectDefaultMetrics({register: this.registry})
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
            name: 'sqd_processor_ingest_blocks_per_second',
            help: 'Data fetching speed',
            registers: [this.registry],
            collect: collect(() => metrics.getIngestSpeed())
        })

        new Gauge({
            name: 'sqd_processor_sync_eta_seconds',
            help: 'Estimated time until all required blocks will be processed or until chain height will be reached',
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

    addChainRpcMetrics(client: {
        getMetrics(): RpcConnectionMetrics[]
    }): void {

        const gauge = (
            name: string,
            help: string,
            get: (con: RpcConnectionMetrics) => number
        ) => {
            new Gauge({
                name,
                help,
                registers: [this.registry],
                labelNames: ['id', 'url'],
                collect() {
                    for (let con of client.getMetrics()) {
                        this.set({url: con.url, id: con.id}, get(con))
                    }
                }
            })
        }

        gauge(
            'sqd_processor_chain_rpc_requests_served',
            'Number of chain rpc requests served',
            con => con.requestsServed
        )

        gauge(
            'sqd_processor_chain_rpc_errors',
            'Number of chain rpc connection errors',
            con => con.connectionErrors
        )

        gauge(
            'sqd_processor_chain_rpc_avg_response_time_seconds',
            'Avg response time',
            con => con.avgResponseTimeSeconds
        )
    }

    registerArchiveError(archiveUrl: string): void {
        this.archiveErrorsCounter.inc({url: archiveUrl})
    }

    serve(): Promise<ListeningServer> {
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
