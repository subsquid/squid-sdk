import {createLogger} from "@subsquid/logger"
import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {runProgram} from "@subsquid/util-internal"
import {Command, InvalidOptionArgumentError} from "commander"
import * as process from "process"
import {ArchiveApi} from "./archiveApi"
import {ChainApi} from "./chainApi"
import {explore, ExploreApi} from "./explore"
import {Out} from "./out"


const log = createLogger('sqd:substrate-metadata-explorer')


runProgram(async () => {
    let program = new Command()

    program.description(`
Finds all chain spec versions and stores its metadata in JSON lines file.

Either WebSocket chain node RPC endpoint or squid archive can serve as a data source.

If the output file already exists, it will not start from scratch, 
but rather try to augment it.
`.trim())

    program.usage('squid-substrate-metadata-explorer --chain <ws://> --out <file> [options]')
    program.requiredOption('--out <file>', 'output file')
    program.option('--archive <url>', 'squid substrate archive', urlOptionValidator(['http:', 'https:']))
    program.option('--chain <ws://>', 'chain rpc endpoint', urlOptionValidator(['ws:', 'wss:']))

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
        let client = new ResilientRpcClient({
            url: options.chain,
            maxRetries: 3,
            onRetry(err, errorsInRow, backoff) {
                log.warn({reason: err.message, backoff}, 'RPC retry')
            }
        })
        api = new ChainApi(client, log)
    } else {
        log.fatal('either --archive or --chain option is required')
        process.exit(1)
    }

    await explore(api, out, log)
}, err => log.fatal(err))


function urlOptionValidator(protocol?: string[]): (s: string) => string {
    return function (s) {
        let url
        try {
            url = new URL(s)
        } catch(e: any) {
            throw new InvalidOptionArgumentError('invalid url')
        }
        if (protocol && !protocol.includes(url.protocol)) {
            throw new InvalidOptionArgumentError(`invalid protocol, expected ${protocol.join(', ')}`)
        }
        return url.toString()
    }
}
