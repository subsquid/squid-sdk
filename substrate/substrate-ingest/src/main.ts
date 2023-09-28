import * as Sentry from '@sentry/node'
import sms from 'source-map-support'
import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {createHttpServer, HttpContext, waitForInterruption} from '@subsquid/util-internal-http-server'
import {assertRange, Range} from '@subsquid/util-internal-range'
import {Command} from 'commander'
import {Ingest, IngestOptions} from './ingest'

sms.install()
Sentry.init({
    attachStacktrace: true,
})

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
        let server = await createHttpServer(ctx => {
            return ingestHandler(ingest, ctx).catch(err => {
                log.error(err)
                throw err
            })
        }, options.service)

        log.info(
            `Data service is listening in port ${server.port}. ` +
            `Note, that the service is dumb and not supposed to be public.`
        )

        await waitForInterruption(server)
    }
}, async err => {
    Sentry.captureException(err)
    await Sentry.flush()
    log.fatal(err)
})


async function ingestHandler(ingest: Ingest, ctx: HttpContext): Promise<void> {
    if (ctx.request.method == 'POST') {
        let body = await getTextBody(ctx)
        let range: Range
        try {
            range = JSON.parse(body)
            assertRange(range)
        } catch(err: any) {
            return ctx.send(400, `Invalid requested range:\n\n${err.stack}`)
        }
        ctx.response.setHeader('content-type', 'text/plain')
        await ingest.run(range, ctx.response)
    } else {
        ctx.send(200, 'POST data range to receive data')
    }
}


function getTextBody(ctx: HttpContext): Promise<any> {
    return new Promise((resolve, reject) => {
        let body = ''
        ctx.request.setEncoding('utf-8')
        ctx.request.on('data', chunk => body += chunk)
        ctx.request.on('end', () => resolve(body))
        ctx.request.on('error', reject)
    })
}
