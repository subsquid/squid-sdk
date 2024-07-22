import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Counter, Registry} from 'prom-client'


export class PrometheusServer {
    private registry = new Registry()
    private s3RequestsCounter: Counter

    constructor(
        private port: number,
    ) {
        this.s3RequestsCounter = new Counter({
            name: 'sqd_s3_request_count',
            help: 'Number of s3 requests made',
            labelNames: ['kind'],
            registers: [this.registry],
        })

        collectDefaultMetrics({register: this.registry})
    }

    incS3Requests(kind: string, value?: number) {
        this.s3RequestsCounter.inc({kind}, value)
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
