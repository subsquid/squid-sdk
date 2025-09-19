import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Counter, Gauge, Registry} from 'prom-client'

export class PrometheusServer {
    private registry = new Registry()
    private s3RequestsCounter: Counter
    private latestReceivedBlockNumberGauge: Gauge
    private latestReceivedBlockTimestampGauge: Gauge
    private blocksDeliveryDelayGauge: Gauge
    constructor(
        private port: number
    ) {
        this.s3RequestsCounter = new Counter({
            name: 'sqd_s3_request_count',
            help: 'Number of s3 requests made',
            labelNames: ['kind'],
            registers: [this.registry],
        })

        this.latestReceivedBlockNumberGauge = new Gauge({
            name: 'sqd_latest_received_block_number',
            help: 'Latest block number received',
            registers: [this.registry]
        })

        this.latestReceivedBlockTimestampGauge = new Gauge({
            name: 'sqd_latest_received_block_timestamp',
            help: 'Timestamp of latest received block',
            registers: [this.registry]
        })

        this.blocksDeliveryDelayGauge = new Gauge({
            name: 'sqd_blocks_delivery_delay',
            help: 'Delay in seconds between block minted and received',
            registers: [this.registry]
        })

        collectDefaultMetrics({register: this.registry})
    }

    incS3Requests(kind: string, value?: number) {
        this.s3RequestsCounter.inc({kind}, value)
    }

    setLastReceivedBlock(blockHeight: number, blockTimestamp: number) {
        this.latestReceivedBlockNumberGauge.set(blockHeight)
        this.latestReceivedBlockTimestampGauge.set(blockTimestamp)
        this.blocksDeliveryDelayGauge.set(Math.floor(Date.now() / 1000) - blockTimestamp)
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
