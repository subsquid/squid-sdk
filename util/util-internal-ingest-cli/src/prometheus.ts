import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Registry} from 'prom-client'
import {S3Fs} from '@subsquid/util-internal-fs'


export class PrometheusServer {
    private registry = new Registry()
    private s3RequestsGauge: Gauge

    constructor(
        private port: number,
    ) {
        this.s3RequestsGauge = new Gauge({
            name: 'sqd_s3_request_count',
            help: 'Number of s3 requests made',
            labelNames: ['kind'],
            registers: [this.registry],
            collect() {
                for (const [kind, value] of Object.entries(S3Fs.getMetrics())) {
                    this.set({
                        kind: kind
                    }, value)
                }
            }
        })

        collectDefaultMetrics({register: this.registry})
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
