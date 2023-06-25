import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {Command} from 'commander'
import {Dumper, ErrorMessage} from './dumper'


const log = createLogger('sqd:substrate-dump')


runProgram(() => {
    let program = new Command()

    program.description('Raw data dumper for substrate based chains')

    program.requiredOption('-e, --endpoint <url>', 'RPC endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.option('-c, --endpoint-capacity <number>', 'Maximum number of pending RPC requests allowed', positiveInt, 10)
    program.option('-r, --endpoint-rate-limit <rps>', 'Maximum RPC rate in requests per second', nat)
    program.option('--dest <archive>', 'Either local dir or s3:// url where to store the dumped data', FileOrUrl(['s3:']))
    program.option('--first-block <number>', 'Height of the block from which to start data ingestion', nat)
    program.option('--last-block <number>', 'Height of the last block to dump', nat)

    let args = program.parse().opts() as {
        endpoint: string
        endpointCapacity?: number
        endpointRateLimit?: number
        dest?: string
        firstBlock?: number
        lastBlock?: number
    }

    return new Dumper(args).dump()

}, err => {
    if (err instanceof ErrorMessage) {
        log.fatal(err.message)
    } else {
        log.fatal(err)
    }
})
