import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {Command} from 'commander'
import {Ingest, IngestOptions} from './ingest'


const log = createLogger('sqd:substrate-ingest')


runProgram(() => {
    let program = new Command()

    program.description('Data decoder and fetcher for substrate based chains')

    program.option('-a, --raw-archive <url>', 'Either local dir or s3:// with raw pre-fetched data', FileOrUrl(['s3:']))
    program.option('-e, --endpoint <url>', 'RPC endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.option('-c, --endpoint-capacity <number>', 'Maximum number of pending RPC requests allowed', positiveInt, 10)
    program.option('-r, --endpoint-rate-limit <rps>', 'Maximum RPC rate in requests per second', nat)
    program.option('--first-block <number>', 'Height of the first block to dump', nat, 0)
    program.option('--last-block <number>', 'Height of the last block to dump', nat)
    program.option('--types-bundle <file>', 'JSON file with custom type definitions')

    let options = program.parse().opts() as IngestOptions
    return new Ingest(options).run()
}, err => log.fatal(err))
