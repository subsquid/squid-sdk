import {waitDrain} from '@subsquid/util-internal'
import {HttpApp} from '@subsquid/util-internal-http-server'
import {NAT, object, option, STRING, ValidationFailure} from '@subsquid/util-internal-validation'
import {DataService} from './data-service'
import {InvalidBaseBlock} from './types'


export function createHttpApp(service: DataService): HttpApp {
    let app = new HttpApp()

    app.add('/', {
        async GET(ctx): Promise<void> {
            ctx.send(200, 'Welcome to Solana hot block data service!')
        }
    })

    let StreamRequest = object({
        fromBlock: NAT,
        parentBlockHash: option(STRING)
    })

    app.add('/stream', {
        async POST(ctx): Promise<void> {
            let req = StreamRequest.cast(await ctx.getJson())
            if (req instanceof ValidationFailure) {
                return ctx.send(400, req.toString())
            }

            let start = Date.now()
            let maxDuration = 60 * 1000 // 1 minute

            let res = await service.query(req.fromBlock, req.parentBlockHash)
            if (res instanceof InvalidBaseBlock) {
                return ctx.send(409, {previousBlocks: res.prev})
            }

            if (res.finalizedHead) {
                ctx.response.setHeader('x-sqd-finalized-head-number', res.finalizedHead.number+'')
                ctx.response.setHeader('x-sqd-finalized-head-hash', res.finalizedHead.hash)
            }

            if (res.head == null && res.tail == null) {
                return ctx.send(204)
            }

            ctx.response.setHeader('content-type', 'text/plain; charset=UTF-8')

            if (res.head || res.tail?.length) {
                ctx.response.setHeader('content-encoding', 'gzip')
            }

            if (res.head) {
                for await (let batch of res.head) {
                    for (let block of batch) {
                        if (ctx.response.writableNeedDrain || !ctx.response.writable) {
                            if (Date.now() - start > maxDuration) {
                                break
                            }
                            await waitDrain(ctx.response)
                        }
                        ctx.response.write(block.jsonLineGzip)
                    }
                    // check after each batch to ensure,
                    // that time limits are checked in case of slow arriving tiny batches
                    if (Date.now() - start > maxDuration) {
                        break
                    }
                }
            }

            if (res.tail) {
                for (let block of res.tail) {
                    if (ctx.response.writableNeedDrain || !ctx.response.writable) {
                        if (Date.now() - start > maxDuration) {
                            break
                        }
                        await waitDrain(ctx.response)
                    }
                    ctx.response.write(block.jsonLineGzip)
                }
            }

            ctx.response.end()
        }
    })

    app.add('/finalized-head', {
        async GET(ctx): Promise<void> {
            ctx.send(200, service.getFinalizedHead())
        }
    })

    app.add('/head', {
        async GET(ctx): Promise<void> {
            ctx.send(200, service.getHead())
        }
    })

    app.add('/readiness', {
        async GET(ctx): Promise<void> {
            if (await service.isReady()) {
                ctx.send(200, 'true')
            } else {
                ctx.send(503, 'false')
            }
        }
    })

    app.add('/metrics', {
        async GET(ctx) {
            if (ctx.url.searchParams.get('json') === 'true') {
                let value = await service.metrics.registry.getMetricsAsJSON()
                ctx.send(200, value)
            } else {
                let value = await service.metrics.registry.metrics()
                ctx.send(200, value, service.metrics.registry.contentType)
            }
        }
    })

    app.add('/metrics/{name}', {
        async GET(ctx) {
            if (service.metrics.registry.getSingleMetric(ctx.params.name)) {
                let value = await service.metrics.registry.getSingleMetricAsString(ctx.params.name)
                ctx.send(200, value)
            } else {
                ctx.send(404, 'requested metric not found')
            }
        }
    })

    app.setMaxRequestBody(1024)

    return app
}
