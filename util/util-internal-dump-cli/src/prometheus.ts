import {Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Counter, Registry} from 'prom-client'


export class PrometheusServer {
    private registry = new Registry()
    private chainHeightGauge: Gauge
    private lastWrittenBlockGauge: Gauge
    private rpcRequestsGauge: Gauge
    private s3RequestsCounter: Counter

    constructor(
        private port: number,
        getFinalizedHeight: () => Promise<number>,
        rpc: RpcClient,
        log: Logger
    ) {
        let chainHeight = 0

        this.chainHeightGauge = new Gauge({
            name: 'sqd_dump_chain_height',
            help: 'Finalized head of a chain',
            registers: [this.registry],
            async collect() {
                try {
                    chainHeight = await getFinalizedHeight()
                } catch(err: any) {
                    log.error(err, 'failed to acquire chain height')
                }
                this.set(chainHeight)
            }
        })

        this.lastWrittenBlockGauge = new Gauge({
            name: 'sqd_dump_last_written_block',
            help: 'Last saved block',
            registers: [this.registry]
        })

        this.rpcRequestsGauge = new Gauge({
            name: 'sqd_rpc_request_count',
            help: 'Number of rpc requests made',
            labelNames: ['url', 'kind'],
            registers: [this.registry],
            collect() {
                let metrics = rpc.getMetrics()

                this.set({
                    url: metrics.url,
                    kind: 'success'
                }, metrics.requestsServed)

                this.set({
                    url: metrics.url,
                    kind: 'failure'
                }, metrics.connectionErrors)
            }
        })

        this.s3RequestsCounter = new Counter({
            name: 'sqd_s3_request_count',
            help: 'Number of s3 requests made',
            labelNames: ['kind'],
            registers: [this.registry],
        })

        collectDefaultMetrics({register: this.registry})
    }

    setLastWrittenBlock(block: number) {
        this.lastWrittenBlockGauge.set(block)
    }

    incS3Requests(kind: string, value?: number) {
        this.s3RequestsCounter.inc({kind}, value)
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
