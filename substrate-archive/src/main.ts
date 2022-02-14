import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {readOldTypesBundle} from "@subsquid/substrate-metadata"
import assert from "assert"
import {Command, InvalidOptionArgumentError} from "commander"
import {Ingest} from "./ingest"
import {WritableSink} from "./sink"
import {AbortHandle} from "./util/abort"
import {ServiceManager} from "./util/sm"


ServiceManager.run(async sm => {
    let program = new Command()

    program.description('Data dumper for substrate based chains')

    program.requiredOption('--chain <url>', 'WS rpc endpoint', urlOptionValidator(['ws:', 'wss:']))
    program.option('--types-bundle <file>', 'JSON file with custom type definitions')
    program.option('--out <sink>', 'Name of a file or postgres connection string')
    program.option('--start-block <number>', 'Height of the block from which to start processing', positiveInteger)

    let options = program.parse().opts() as {
        chain: string
        out?: string
        typesBundle?: string
        startBlock?: number
    }

    let typesBundle = options.typesBundle == null
        ? undefined
        : readOldTypesBundle(options.typesBundle)

    let client = sm.add(new ResilientRpcClient(options.chain))
    let sink = new WritableSink(process.stdout)
    let abort = sm.add(new AbortHandle())

    let blocks = Ingest.getBlocks({
        client,
        typesBundle,
        startBlock: options.startBlock
    })

    for await (let block of blocks) {
        abort.assertNotAborted()
        await sink.write(block)
    }
})


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


function positiveInteger(s: string): number {
    let n = parseInt(s)
    assert(!isNaN(n) && n >= 0)
    return n
}
