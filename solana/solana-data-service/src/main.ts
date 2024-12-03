import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {runProgram, waitDrain} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {HttpApp} from '@subsquid/util-internal-http-server'
import {NAT, object, option, STRING, ValidationFailure} from '@subsquid/util-internal-validation'
import {Command} from 'commander'
import {InvalidBaseBlock} from './chain'
import {SolanaService} from './service'


const log = createLogger('sqd:solana-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Solana')
    program.requiredOption('--http-rpc <url>', 'HTTP RPC url', Url(['http:', 'https:']))
    program.option('--http-rpc-capacity <number>', 'Maximum number of pending HTTP RPC requests allowed', positiveInt, 100)
    program.option('--ws-rpc <url>', 'Websocket RPC url', Url(['ws:', 'wss:']))
    program.option('--geyser-rpc <url>', 'Yellowstone gRPC url')
    program.option('--buffer-size <number>', 'Max number of blocks to buffer', positiveInt, 500)
    program.option('-p, --port <number>', 'port to listen on', positiveInt, 3000)
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        httpRpcCapacity: number
        wsRpc?: string
        geyserRpc?: string
        bufferSize: number
        port: number
    }

    let httpRpc = new RpcClient({
        url: args.httpRpc,
        capacity: args.httpRpcCapacity,
        fixUnsafeIntegers: true
    })

    let websocketRpc = args.wsRpc == null ? undefined : new RpcClient({
        url: args.wsRpc,
        fixUnsafeIntegers: true
    })

    let service = new SolanaService({
        httpRpc,
        websocketRpc,
        votes: false,
        bufferSize: args.bufferSize
    })

    await service.init()

    let app = createHttpApp(service)
    let httpServer = await app.listen(args.port)
    log.info(`listening on port ${httpServer.port}`)

    try {
        await service.run()
    } finally {
        await httpServer.close()
    }
}, err => log.fatal(err))


function createHttpApp(service: SolanaService): HttpApp {
    let app = new HttpApp()

    app.add('/', {
        async GET(ctx): Promise<void> {
            ctx.send(200, 'Welcome to Solana hot block data service!')
        }
    })

    let StreamRequest = object({
        fromBlock: NAT,
        prevBlockHash: option(STRING)
    })

    app.add('/stream', {
        async POST(ctx): Promise<void> {
            let req = StreamRequest.cast(await ctx.getJson())
            if (req instanceof ValidationFailure) {
                ctx.send(400, req.toString())
                return
            }

            let res = await service.query(req.fromBlock, req.prevBlockHash)
            if (res instanceof InvalidBaseBlock) {
                ctx.send(409, res.prev)
                return
            }

            ctx.response.setHeader('x-sqd-finalized-head-number', res.finalizedHead.number)
            ctx.response.setHeader('x-sqd-finalized-head-hash', res.finalizedHead.hash)
            if (res.blockStream == null) {
                let len = res.blocks.reduce((len, b) => len + b.jsonLineByteLength, 0)
                if (len == 0) return ctx.send(204)
                ctx.response.setHeader('content-length', len)
            }

            let lines = 0
            for (let block of res.blocks) {
                lines += 1
                if (lines % 5 == 0) {
                    await waitDrain(ctx.response)
                }
                ctx.response.write(block.jsonLine)
            }

            if (res.blockStream) {
                try {
                    for await (let batch of res.blockStream) {
                        for (let block of res.blocks) {
                            lines += 1
                            if (lines % 5 == 0) {
                                await waitDrain(ctx.response)
                            }
                            ctx.response.write(block.jsonLine)
                        }
                    }
                    ctx.response.end()
                } catch(err: any) {
                    if (res.blocks.length > 0) {
                        log.error(err)
                        ctx.response.end()
                    } else {
                        throw err
                    }
                }
            }
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
