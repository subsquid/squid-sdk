import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import * as http from "http"
import {collectDefaultMetrics, Gauge, Registry} from "prom-client"
import stoppable from "stoppable"
import type {IngestMetrics} from "./ingest"


export interface ListeningServer {
    port: number
    close(): Promise<void>
}


export class Prometheus implements IngestMetrics {
    private registry = new Registry()

    private lastBlock = new Gauge({
        name: 'sqd_processor_last_block',
        help: 'Last processed block',
        registers: [this.registry],
        aggregator: 'max'
    })

    private chainHeight = new Gauge({
        name: 'sqd_processor_chain_height',
        help: 'Chain height of the data source',
        registers: [this.registry],
        aggregator: 'max'
    })

    private mappingSpeed = new Gauge({
        name: 'sqd_processor_mapping_blocks_per_second',
        help: 'Mapping performance',
        registers: [this.registry],
        aggregator: 'average'
    })

    private ingestSpeed = new Gauge({
        name: 'sqd_processor_ingest_blocks_per_second',
        help: 'Data fetching speed',
        registers: [this.registry],
        aggregator: 'average'
    })

    private syncETA = new Gauge({
        name: 'sqd_processor_sync_eta_seconds',
        help: 'Estimated time until all required blocks will be processed or until chain height will be reached',
        registers: [this.registry]
    })

    constructor() {
        collectDefaultMetrics({register: this.registry})
        this.setLastProcessedBlock(-1)
        this.setChainHeight(-1)
    }

    setLastProcessedBlock(height: number): void {
        this.lastBlock.set(height)
    }

    setChainHeight(height: number): void {
        this.chainHeight.set(height)
    }

    setMappingSpeed(blocksPerSecond: number): void {
        this.mappingSpeed.set(blocksPerSecond)
    }

    setIngestSpeed(blocksPerSecond: number): void {
        this.ingestSpeed.set(blocksPerSecond)
    }

    setSyncETA(seconds: number): void {
        this.syncETA.set(seconds)
    }

    private async handleHttpRequest(
        req: http.IncomingMessage,
        send: (status: number, body?: string | object, type?: string) => void
    ): Promise<void> {
        let url = new URL(assertNotNull(req.url), `http://${req.headers.host}`)
        let path = url.pathname.slice(1).split('/')
        if (path[0] != 'metrics') return send(404)
        let metricName = path[1]
        if (metricName) {
            if (this.registry.getSingleMetric(metricName)) {
                let value = await this.registry.getSingleMetricAsString(metricName)
                return send(200, value)
            } else {
                return send(404, 'requested metric not found')
            }
        } else if (url.searchParams.get('json') == 'true') {
            let value = await this.registry.getMetricsAsJSON()
            return send(200, value)
        } else {
            let value = await this.registry.metrics()
            return send(200, value, this.registry.contentType)
        }
    }

    serve(port: number | string): Promise<ListeningServer> {
        function send(res: http.ServerResponse, status: number, body?: string | object, type?: string): void {
            body = body || http.STATUS_CODES[status] || ''
            type = type || (typeof body == 'string' ? 'text/plain' : 'application/json')
            if (typeof body != 'string') {
                body = JSON.stringify(body)
            }
            res.statusCode = status
            res.setHeader('content-type', type+'; charset=UTF-8')
            res.setHeader('content-length', Buffer.byteLength(body))
            res.end(body)
        }

        let server = stoppable(http.createServer(async (req, res) => {
            try {
                await this.handleHttpRequest(req, send.bind(this, res))
            } catch(err: any) {
                if (res.headersSent) {
                    res.destroy()
                } else {
                    send(res, 500, err.stack)
                }
            }
        }))

        function close(): Promise<void> {
            return new Promise((resolve, reject) => {
                server.stop((err, gracefully) => {
                    if (gracefully) {
                        resolve()
                    } else {
                        reject(err || new Error('Failed to shutdown gracefully'))
                    }
                })
            })
        }

        return new Promise<ListeningServer>((resolve, reject) => {
            server.listen(port, (err?: Error) => {
                if (err) {
                    reject(err)
                } else {
                    let address = server.address()
                    assert(address != null && typeof address == 'object')
                    resolve({
                        port: address.port,
                        close
                    })
                }
            })
        })
    }
}
