import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {Command} from 'commander'
import {Dumper, DumperOptions, ErrorMessage} from './dumper'


const log = createLogger('sqd:tron-dump')


runProgram(() => {
    let program = new Command()

    program.description('Raw data dumper for tron based chains')

    program.requiredOption('-e, --endpoint <url>', 'HTTP API endpoint', Url(['http:', 'https:']))
    program.option('--dest <archive>', 'Either local dir or s3:// url where to store the dumped data', FileOrUrl(['s3:']))
    program.option('--first-block <number>', 'Height of the first block to dump', nat)
    program.option('--last-block <number>', 'Height of the last block to dump', nat)
    program.option('--with-trace', 'Fetch block trace')
    program.option('--chunk-size <MB>', 'Data chunk size in megabytes', positiveInt, 32)
    program.option('--metrics <port>', 'Enable prometheus metrics server', nat)

    let args = program.parse().opts() as DumperOptions

    return new Dumper(args).dump()

}, err => {
    if (err instanceof ErrorMessage) {
        log.fatal(err.message)
    } else {
        log.fatal(err)
    }
})
