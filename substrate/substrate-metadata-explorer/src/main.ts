import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {Url} from '@subsquid/util-internal-commander'
import {RpcClient} from '@subsquid/util-internal-resilient-rpc'
import {Command} from 'commander'
import * as process from 'process'
import {ArchiveApi} from './archiveApi'
import {ChainApi} from './chainApi'
import {explore, ExploreApi} from './explore'
import {Out} from './out'


const log = createLogger('sqd:substrate-metadata-explorer')


runProgram(async () => {
    let program = new Command()

    program.description(`
Finds all chain spec versions and stores its metadata in JSON lines file.

Either chain node RPC endpoint or squid archive can serve as a data source.

If the output file already exists, it will not start from scratch, 
but rather try to augment it.
`.trim())

    program.usage('squid-substrate-metadata-explorer --chain <url> --out <file> [options]')
    program.requiredOption('--out <file>', 'output file')
    program.option('--archive <url>', 'squid substrate archive', Url(['http:', 'https:']))
    program.option('--chain <url>', 'chain rpc endpoint', Url(['http:', 'https:', 'ws:', 'wss:']))

    let options = program.parse().opts() as {
        out: string
        chain?: string
        archive?: string
    }

    let api: ExploreApi
    let out = new Out(options.out)
    if (out.isJson()) {
        log.warn(`JSON lines (.jsonl) format is recommended instead of .json, but output file is set to ${options.out}`)
    }

    if (options.archive) {
        api = new ArchiveApi(options.archive, log)
    } else if (options.chain) {
        let client = new RpcClient({
            endpoints: [{
                url: options.chain,
                capacity: 5
            }],
            retryAttempts: 3,
            log: log.child('chain-rpc')
        })
        api = new ChainApi(client, log)
    } else {
        log.fatal('either --archive or --chain option is required')
        process.exit(1)
    }

    await explore(api, out, log)
}, err => log.fatal(err))
