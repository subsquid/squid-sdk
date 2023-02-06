import {def} from "@subsquid/util-internal"
import type {Progress} from "@subsquid/util-internal-counters"
import {createPrometheusServer, ListeningServer} from "@subsquid/util-internal-prometheus-server"
import {collectDefaultMetrics, Gauge, Registry} from "prom-client"
import type {RpcClient, RpcConnectionMetrics} from "@subsquid/util-internal-resilient-rpc"


export class Metrics {
    private registry = new Registry()
    private gauges = new Set<string>()

    addProgress(progress: Progress): void {
        this.add('progress')

        new Gauge({
            name: 'sqd_progress_blocks_per_second',
            help: 'Overall block processing speed',
            collect(this) {
                this.set(progress.speed())
            },
            registers: [this.registry]
        })

        new Gauge({
            name: 'sqd_last_block',
            help: 'Last saved block',
            registers: [this.registry],
            collect() {
                this.set(progress.getCurrentValue())
            }
        })
    }

    addRpcMetrics(client: RpcClient): void {
        this.add('rpc')

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
            'sqd_chain_rpc_avg_response_time_seconds',
            'Avg response time of connection',
            con => con.avgResponseTimeSeconds
        )

        gauge(
            'sqd_chain_rpc_requests_served',
            'Total number of requests served by connection',
            con => con.requestsServed
        )

        gauge(
            'sqd_chain_rpc_connection_errors',
            'Total number of connection errors',
            con => con.connectionErrors
        )
    }

    private add(name: string): void {
        if (this.gauges.has(name)) {
            throw new Error(`${name} metric was already registered`)
        } else {
            this.gauges.add(name)
        }
    }

    @def
    addDefaultMetrics(): void {
        collectDefaultMetrics({register: this.registry})
    }

    serve(port?: string | number): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, port)
    }
}
