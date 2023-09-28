import * as Sentry from '@sentry/node'
import sms from 'source-map-support';
import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {Command} from 'commander'
import {Dumper, DumperOptions, ErrorMessage} from './dumper'

sms.install()
Sentry.init({
    attachStacktrace: true,
})

const log = createLogger('sqd:substrate-dump')


runProgram(() => {
    let program = new Command()

    program.description('Raw data dumper for substrate based chains')

    program.requiredOption('-e, --endpoint <url>', 'RPC endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.option('-c, --endpoint-capacity <number>', 'Maximum number of pending RPC requests allowed', positiveInt, 10)
    program.option('-r, --endpoint-rate-limit <rps>', 'Maximum RPC rate in requests per second', nat)
    program.option('-b, --endpoint-max-batch-call-size <number>', 'Maximum size of RPC batch call', positiveInt)
    program.option('--dest <archive>', 'Either local dir or s3:// url where to store the dumped data', FileOrUrl(['s3:']))
    program.option('--first-block <number>', 'Height of the first block to dump', nat)
    program.option('--last-block <number>', 'Height of the last block to dump', nat)
    program.option('--with-trace [targets]', 'Fetch block trace')
    program.option('--chunk-size <MB>', 'Data chunk size in megabytes', positiveInt, 32)
    program.option('--metrics <port>', 'Enable prometheus metrics server', nat)

    let args = program.parse().opts() as DumperOptions

    return new Dumper(args).dump()

}, async err => {
    Sentry.captureException(err);
    await Sentry.flush()
    if (err instanceof ErrorMessage) {
        log.fatal(err.message)
    } else {
        log.fatal(err)
    }
})
