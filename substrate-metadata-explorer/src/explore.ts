import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {last} from "@subsquid/util-internal"
import * as fs from "fs"
import {Archive} from "./archive"
import {findSpecVersions} from "./binarySearch"
import {Chain} from "./chain"
import type {SpecVersionWithMetadata} from "./types"


export interface ExploreOptions {
    /**
     * WS rpc endpoint of a chain node
     */
    chain: string
    /**
     * Substrate archive url to speed-up exploration
     */
    archive?: string
    /**
     * Output file to save results in.
     *
     * Existing file will be augmented with new spec versions, if any.
     */
    out: string
}


export async function explore(options: ExploreOptions): Promise<void> {
    let client = new ResilientRpcClient(options.chain)
    try {
        let chain = new Chain(client)
        let archive = options.archive ? new Archive(options.archive, chain) : undefined
        await doExploration(options.out, chain, archive)
    } finally {
        client.close()
    }
}


async function doExploration(
    out: string,
    chain: Chain,
    archive?: Archive
): Promise<void> {
    let api = archive || chain
    let fromBlock = 0
    let chainHeight = await api.getHeight()

    let knownVersions = read(out)
    if (knownVersions.length) {
        let genesis = knownVersions[0]
        if (genesis.blockNumber == 0) {
            let currentGenesis = await chain.getSpecVersion(0)
            if (currentGenesis.blockHash != genesis.blockHash) {
                console.log(`output file has explored versions, but for different chain`)
                console.log(`will do exploration from scratch`)
                knownVersions = []
            } else {
                fromBlock = last(knownVersions).blockNumber
                if (chainHeight <= fromBlock) {
                    console.log(`output file has explored versions up to block ${fromBlock}, but the height of the source is ${chainHeight}`)
                    console.log(`nothing to explore`)
                    return
                }
                console.log(`output file has explored versions`)
                console.log(`will start from block ${fromBlock} and augment the file`)
                if (knownVersions[0].specName == null) {
                    // we've got an old file
                    // fill in the specName
                    for (let i = 0; i < knownVersions.length; i++) {
                        let {specName, ...rest} = knownVersions[i]
                        knownVersions[i] = {
                            specName: currentGenesis.specName,
                            ...rest
                        }
                    }
                }
            }
        } else {
            console.log(`output file has explored versions, but genesis block is absent`)
            console.log(`will do exploration from scratch`)
            knownVersions = []
        }
    }

    let newVersions = await findSpecVersions({
        firstBlock: fromBlock,
        lastBlock: chainHeight,
        fetch(heights) {
            return api.getSpecVersions(heights)
        },
        log(msg) {
            console.log(msg)
        }
    })

    if (knownVersions.length) {
        newVersions = newVersions.slice(1)
    }

    for (let v of newVersions) {
        console.log(`fetching metadata for ${v.specName}@${v.specVersion}`)
        let metadata = await chain.getMetadata(v.blockHash)
        knownVersions.push({
            ...v,
            metadata
        })
    }

    fs.writeFileSync(out, JSON.stringify(knownVersions, null, 2))
}


function read(file: string): SpecVersionWithMetadata[] {
    if (!fs.existsSync(file)) return []
    let json = fs.readFileSync(file, 'utf-8')
    let versions: SpecVersionWithMetadata[] = JSON.parse(json)
    return versions.sort((a, b) => a.blockNumber - b.blockNumber)
}
