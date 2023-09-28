import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {Rpc} from '@subsquid/substrate-data-raw'
import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Registry} from 'prom-client'


const LOG = createLogger('sqd:substrate-dump:prometheus')


export class PrometheusServer {
    private registry = new Registry()
    private chainHeightGauge: Gauge
    private lastWrittenBlockGauge: Gauge
    private rpcRequestsGauge: Gauge

    constructor(private port: number, rpcClient: RpcClient) {
        let chainHeight = 0

        this.chainHeightGauge = new Gauge({
            name: 'sqd_dump_chain_height',
            help: 'Finalized head of a chain',
            registers: [this.registry],
            async collect() {
                let rpc = new Rpc(rpcClient, {
                    retryAttempts: 0,
                    timeout: 5000
                })

                try {
                    let head = await rpc.getFinalizedHead()
                    let header = await rpc.getBlock0(head)
                    chainHeight = header.height
                } catch(err: any) {
                    LOG.error(err, 'failed to acquire chain height')
                }

                this.set(chainHeight)
            }
        });

        this.lastWrittenBlockGauge = new Gauge({
            name: 'sqd_dump_last_written_block',
            help: 'Last saved block',
            registers: [this.registry]
        });

        this.rpcRequestsGauge = new Gauge({
            name: 'sqd_rpc_request_count',
            help: 'Number of rpc requests made',
            labelNames: ['url', 'kind'],
            registers: [this.registry],
            collect() {
                let metrics = rpcClient.getMetrics()

                this.set({
                    url: rpcClient.url,
                    kind: 'success'
                }, metrics.requestsServed)

                this.set({
                    url: rpcClient.url,
                    kind: 'failure'
                }, metrics.connectionErrors)
            }
        });

        collectDefaultMetrics({register: this.registry})
    }

    setLastWrittenBlock(block: number) {
        this.lastWrittenBlockGauge.set(block)
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
