import { RpcClient } from '@subsquid/rpc-client';
import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import promClient, { collectDefaultMetrics, Gauge, Registry } from 'prom-client';


export class PrometheusServer {
    private registry = new Registry()
    private port?: number | string
    private chainHeightGauge: Gauge;
    private lastWrittenBlockGauge: Gauge;
    private rpcRequestsGauge: Gauge;

    constructor(port: number, rpc: RpcClient) {
        this.port = port;
        this.chainHeightGauge = new Gauge({
            name: 'sqd_dump_chain_height',
            help: 'Last block available in the chain',
            registers: [this.registry]
        });

        this.lastWrittenBlockGauge = new Gauge({
            name: 'sqd_dump_last_written_block',
            help: 'Last saved block',
            registers: [this.registry]
        });

        this.rpcRequestsGauge = new Gauge({
            name: 'sqd_dump_rpc_requests_count',
            help: 'Number of rpc requests of different kinds',
            labelNames: ['kind', 'url'],
            registers: [this.registry],
            collect() {
                const metrics = rpc.getMetrics();
                this.set({
                    kind: 'successful',
                    url: rpc.url
                }, metrics.requestsServed);
                this.set({
                    kind: 'failed',
                    url: rpc.url
                }, metrics.connectionErrors);
            }
        });

        collectDefaultMetrics({register: this.registry})
    }

    setChainHeight(height: number) {
        this.chainHeightGauge.set(height);
    }

    setLastWrittenBlock(block: number) {
        this.lastWrittenBlockGauge.set(block);
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
