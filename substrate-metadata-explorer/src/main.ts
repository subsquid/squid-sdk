import {Command, InvalidOptionArgumentError} from "commander"
import * as fs from "fs"
import * as process from "process"
import {exploreChainVersions} from "./index"
import {ChainVersion} from "./types"


export function run() {
    let program = new Command()

    program.description(`
Explores chain spec versions.

It scans the chain and finds all blocks where new spec version was introduced.
The result of exploration is saved in a json file:

[
    {
        "specVersion": 1,
        "blockNumber": 10,
        "blockHash": "0x..",
        "metadata": "0x.."
    },
    ...
]

If the output file already exists, exploration will start from the last known block.
The resulting file will be updated with new data.
`.trim())

    program.usage('squid-substrate-metadata-explorer --chain <ws://> --out <file> [options]')
    program.requiredOption('--chain <ws://>', 'chain rpc endpoint', urlOptionValidator(['ws:', 'wss:']))
    program.requiredOption('--out <file>', 'output file')
    program.option(
        '--archive <url>',
        'squid substrate archive (significantly speedups exploration)',
        urlOptionValidator(['http:', 'https:'])
    )

    let options = program.parse().opts() as {
        chain: string
        out: string
        archive?: string
    }

    let fromBlock = 0
    let initialData: ChainVersion[] | undefined
    if (fs.existsSync(options.out)) {
        initialData = JSON.parse(fs.readFileSync(options.out, 'utf-8'))
        initialData?.sort((a, b) => a.blockNumber - b.blockNumber)
    }
    if (initialData?.length) {
        fromBlock = initialData[initialData.length - 1].blockNumber
        console.log(`output file has explored versions, will continue from there and augment the file`)
    }

    if (fromBlock > 0) {
        console.log(`starting from block: ${fromBlock}`)
    }

    exploreChainVersions({
        chainEndpoint: options.chain,
        archiveEndpoint: options.archive,
        fromBlock,
        log: msg => console.log(msg)
    }).then(versions => {
        let data = initialData ? initialData.concat(versions.slice(1)) :  versions
        fs.writeFileSync(options.out, JSON.stringify(data, null, 2))
    }).catch(err => {
        console.error(err)
        process.exit(1)
    })
}


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
