import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {HttpApp, HttpContext, waitForInterruption} from '@subsquid/util-internal-http-server'
import {assertRange, isRange} from '@subsquid/util-internal-range'
import {Command} from 'commander'
import {Ingest, IngestOptions} from './ingest'


const log = createLogger('sqd:substrate-ingest')


runProgram(async () => {
    let program = new Command()

    program.description('Data decoder and fetcher for substrate based chains')

    program.option('-a, --raw-archive <url>', 'Either local dir or s3:// with raw pre-fetched data', FileOrUrl(['s3:']))
    program.option('-e, --endpoint <url>', 'RPC endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.option('-c, --endpoint-capacity <number>', 'Maximum number of pending RPC requests allowed', positiveInt, 10)
    program.option('-r, --endpoint-rate-limit <rps>', 'Maximum RPC rate in requests per second', nat)
    program.option('-b, --endpoint-max-batch-call-size <number>', 'Maximum size of RPC batch call', positiveInt)
    program.option('--first-block <number>', 'Height of the first block to dump', nat, 0)
    program.option('--last-block <number>', 'Height of the last block to dump', nat)
    program.option('--types-bundle <file>', 'JSON file with custom type definitions')
    program.option('--service <port>', 'Run as HTTP data service')

    let options = program.parse().opts() as IngestOptions & {
        firstBlock?: number
        lastBlock?: number
        service?: number
    }

    let ingest = new Ingest(options)

    if (options.service == null) {
        let range = {
            from: options.firstBlock ?? 0,
            to: options.lastBlock
        }
        assertRange(range)
        await ingest.run(range, process.stdout)
    } else {
        await runService(ingest, options.service)
    }
}, err => log.fatal(err))


async function runService(ingest: Ingest, port: number): Promise<void> {
    let app = new HttpApp()
    app.setMaxRequestBody(1024)
    app.setLogger(log.child('service'))

    app.add('/', {
        async GET(ctx: HttpContext) {
            ctx.send(200, 'POST block range to receive data')
        },
        async POST(ctx: HttpContext) {
            let body = await ctx.getJson()
            if (!isRange(body)) return ctx.send(400, `invalid block range - ${JSON.stringify(body)}`)
            ctx.response.setHeader('content-type', 'text/plain')
            await ingest.run(body, ctx.response)
            ctx.response.end()
        }
    })

    let server = await app.listen(port)

    log.child('service').info(
        `Data service is listening in port ${server.port}. ` +
        `Note, that the service is dumb and not supposed to be public.`
    )

    return waitForInterruption(server)
}
