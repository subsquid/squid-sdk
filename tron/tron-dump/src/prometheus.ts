import {createLogger} from '@subsquid/logger'
import {HttpClient} from '@subsquid/http-client'
import {HttpApi} from '@subsquid/tron-data-raw'
import {createPrometheusServer, ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {collectDefaultMetrics, Gauge, Registry} from 'prom-client'


const LOG = createLogger('sqd:tron-dump:prometheus')


export class PrometheusServer {
    private registry = new Registry()
    private chainHeightGauge: Gauge
    private lastWrittenBlockGauge: Gauge

    constructor(private port: number, httpClient: HttpClient) {
        let chainHeight = 0

        this.chainHeightGauge = new Gauge({
            name: 'sqd_dump_chain_height',
            help: 'Head of a chain',
            registers: [this.registry],
            async collect() {
                let httpApi = new HttpApi(httpClient, {
                    retryAttempts: 0,
                    httpTimeout: 5_000
                })

                try {
                    let head = await httpApi.getNowBlock()
                    chainHeight = head.block_header.raw_data.number || 0
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

        collectDefaultMetrics({register: this.registry})
    }

    setLastWrittenBlock(block: number) {
        this.lastWrittenBlockGauge.set(block)
    }

    serve(): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, this.port)
    }
}
