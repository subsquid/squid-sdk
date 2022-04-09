import {Command, InvalidOptionArgumentError} from "commander"
import {explore, ExploreOptions} from "./explore"


export async function run() {
    let program = new Command()

    program.description(`
Explores chain spec versions.

It scans the chain and finds all blocks where new spec version was introduced.
The result of exploration is saved in a json file:

[
    {
        "specName": "polkadot",
        "specVersion": 0,
        "blockNumber": 0,
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

    let options: ExploreOptions = program.parse().opts()

    await explore(options)
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
