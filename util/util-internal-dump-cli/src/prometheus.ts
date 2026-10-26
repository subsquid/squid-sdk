import {RpcClient} from '@subsquid/rpc-client'
import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Counter, Registry} from 'prom-client'


export class PrometheusServer {
    private registry = new Registry()
    private compressionGauge: Gauge
    private chainHeightGauge: Gauge
    private lastWrittenBlockGauge: Gauge
    private rpcRequestsGauge: Gauge
    private rpcRequestsServedTotal: Counter
    private rpcAvgResponseTimeSeconds: Gauge
    private rpcConnectionErrorsTotal: Counter
    private rpcRetriedErrorsTotal: Counter
    private s3RequestsCounter: Counter
    private latestReceivedBlockNumberGauge: Gauge
    private latestReceivedBlockTimestampGauge: Gauge
    private latestProcessedBlockTimestampGauge: Gauge
    private blocksProcessingTimeGauge: Gauge
    private latestProcessedBlockNumberGauge: Gauge
    private blocksDeliveryDelayGauge: Gauge

    constructor(
        private port: number,
        rpc: RpcClient
    ) {
        // Set by the ingest loop: a collect() that calls the RPC hangs the scrape while the endpoint fails.
        this.chainHeightGauge = new Gauge({
            name: 'sqd_dump_chain_height',
            help: 'Finalized head of a chain',
            registers: [this.registry]
        })

        this.compressionGauge = new Gauge({
            name: 'sqd_dump_raw_compression',
            help: 'Compression of the data chunks being written (1 for the active one)',
            labelNames: ['compression'],
            registers: [this.registry]
        })

        this.lastWrittenBlockGauge = new Gauge({
            name: 'sqd_dump_last_written_block',
            help: 'Last saved block',
            registers: [this.registry]
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

        // Duplicate metric of sqd_dump_last_written_block for compatibility with archive.py dumper
        this.latestProcessedBlockNumberGauge = new Gauge({
            name: 'sqd_latest_processed_block_number',
            help: 'Latest processed block number',
            registers: [this.registry]
        })

        this.latestProcessedBlockTimestampGauge = new Gauge({
            name: 'sqd_latest_processed_block_timestamp',
            help: 'Timestamp of the latest processed block',
            registers: [this.registry]
        })

        this.blocksProcessingTimeGauge = new Gauge({
            name: 'sqd_blocks_processing_time',
            help: 'Time taken to process blocks (in seconds)',
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

        this.rpcRequestsServedTotal = new Counter({
            name: 'sqd_chain_rpc_requests_served_total',
            help: 'Total number of served requests by connection',
            labelNames: ['url'],
            registers: [this.registry],
            collect() {
                const metrics = rpc.getMetrics()
                this.reset()
                this.inc({
                    url: metrics.url,
                }, metrics.requestsServed)
            }
        });

        this.rpcAvgResponseTimeSeconds = new Gauge({
            name: 'sqd_chain_avg_response_time_seconds',
            help: 'Avg response time of connection',
            labelNames: ['url'],
            registers: [this.registry],
            collect() {
                const metrics = rpc.getMetrics()

                this.set({
                    url: metrics.url,
                }, metrics.avg_response_time)
                
                this.set({
                    url: metrics.url,
                }, metrics.avgResponseTime)
            }
        });
        this.rpcConnectionErrorsTotal = new Counter({
            name: 'sqd_chain_rpc_connection_errors_total',
            help: 'Total number of connection errors',
            labelNames: ['url'],
            registers: [this.registry],
            collect() {
                const metrics = rpc.getMetrics()
                this.reset()
                this.inc({
                    url: metrics.url,
                }, metrics.connectionErrors)
            }
        });

        this.rpcRetriedErrorsTotal = new Counter({
            name: 'sqd_chain_rpc_retried_errors_total',
            help: 'Total number of retried RPC errors by kind',
            labelNames: ['url', 'kind'],
            registers: [this.registry],
            collect() {
                const metrics = rpc.getMetrics()
                this.reset()
                for (let [kind, count] of Object.entries(metrics.retriedErrors)) {
                    this.inc({url: metrics.url, kind}, count)
                }
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

    setCompression(active: string) {
        for (let compression of ['gzip', 'zstd']) {
            this.compressionGauge.set({compression}, compression == active ? 1 : 0)
        }
    }

    setChainHeight(height: number) {
        this.chainHeightGauge.set(height)
    }

    setLastWrittenBlock(block: number) {
        this.lastWrittenBlockGauge.set(block)
        this.latestProcessedBlockNumberGauge.set(block)
    }
    
    setLatestBlockMetrics(blockNumber: number, mintedTimestamp: number) {
        this.latestReceivedBlockNumberGauge.set(blockNumber)
        this.latestReceivedBlockTimestampGauge.set(mintedTimestamp)
        this.blocksDeliveryDelayGauge.set(Math.floor(Date.now() / 1000) - mintedTimestamp)
    }

    setProcessedBlockMetrics(blockTimestamp: number) {
        this.latestProcessedBlockTimestampGauge.set(blockTimestamp)
        this.blocksProcessingTimeGauge.set(Math.floor(Date.now() / 1000) - blockTimestamp)
    }

    incS3Requests(kind: string, value?: number) {
        this.s3RequestsCounter.inc({kind}, value)
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
