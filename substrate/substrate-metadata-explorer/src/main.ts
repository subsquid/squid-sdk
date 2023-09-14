import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {runProgram} from '@subsquid/util-internal'
import {Url} from '@subsquid/util-internal-commander'
import {Command} from 'commander'
import {explore} from './explore'
import {Out} from './out'
import {RpcApi} from './rpc-api'


const log = createLogger('sqd:substrate-metadata-explorer')


runProgram(async () => {
    let program = new Command()

    program.description(`
Finds all spec versions by performing binary search over chain blocks.

When output file already exists, 
the search will not start from scratch and 
output file will be augmented with newly discovered versions.
`.trim())

    program.usage('substrate-metadata-explorer --rpc <url> --out <file>')
    program.requiredOption('--rpc <url>', 'chain rpc endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.requiredOption('--out <file>', 'output file')

    let options = program.parse().opts() as {
        out: string
        rpc: string
    }

    let out = new Out(options.out)
    if (out.isJson()) {
        log.warn(`JSON lines (.jsonl) format is recommended instead of .json, but output file is set to ${options.out}`)
    }

    let api = new RpcApi(
        new RpcClient({
            url: options.rpc,
            capacity: 10,
            retryAttempts: 5
        }),
        log
    )

    await explore(api, out, log)
}, err => log.fatal(err))
