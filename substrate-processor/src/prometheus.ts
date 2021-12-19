import {assertNotNull} from "@subsquid/util"
import assert from "assert"
import * as http from "http"
import {collectDefaultMetrics, Gauge, Registry} from "prom-client"
import stoppable from "stoppable"


export interface ListeningServer {
    port: number
    stop(): Promise<void>
}


export class Prometheus {
    private registry = new Registry()

    private lastProcessedBlock = new Gauge({
        name: 'substrate_processor:last_processed_block',
        help: 'Last processed block',
        registers: [this.registry],
        aggregator: 'max'
    })

    private chainHeight = new Gauge({
        name: 'substrate_processor:chain_height',
        help: 'Chain height as reported by the data source',
        registers: [this.registry],
        aggregator: 'max'
    })

    constructor() {
        collectDefaultMetrics({register: this.registry})
    }

    setLastProcessedBlock(height: number): void {
        this.lastProcessedBlock.set(height)
    }

    setChainHeight(height: number): void {
        this.chainHeight.set(height)
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

        function stop(): Promise<void> {
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
                        stop
                    })
                }
            })
        })
    }
}
