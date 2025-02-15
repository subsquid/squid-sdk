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

            let res = await service.query(req.fromBlock, req.parentBlockHash)
            if (res instanceof InvalidBaseBlock) {
                return ctx.send(409, res.prev)
            }

            if (res.finalizedHead) {
                ctx.response.setHeader('x-sqd-finalized-head-number', res.finalizedHead.number)
                ctx.response.setHeader('x-sqd-finalized-head-hash', res.finalizedHead.hash)
            }

            if (res.head == null && res.tail == null) {
                return ctx.send(204)
            }

            ctx.response.setHeader('content-type', 'text/plain; charset=UTF-8')

            if (res.head || res.tail?.length) {
                ctx.response.setHeader('content-encoding', 'gzip')
            }

            if (res.head == null && res.tail?.length) {
                let len = res.tail.reduce((len, block) => len + block.jsonLineGzip.length, 0)
                ctx.response.setHeader('content-length', len)
            }

            if (res.head) {
                for await (let block of res.head) {
                    if (ctx.response.writableNeedDrain || !ctx.response.writable) {
                        await waitDrain(ctx.response)
                    }
                    ctx.response.write(block.jsonLineGzip)
                }
            }

            if (res.tail) {
                for (let block of res.tail) {
                    if (ctx.response.writableNeedDrain || !ctx.response.writable) {
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

    app.setMaxRequestBody(1024)

    return app
}
