import type {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {findSpecVersions} from "./binarySearch"
import {SpecVersionWithMetadata, Log, SpecVersion} from "./types"


export async function fromChain(client: ResilientRpcClient, from: number = 0, log?: Log): Promise<SpecVersionWithMetadata[]> {
    let headHash = await client.call('chain_getFinalizedHead')
    let height = await client.call('chain_getHeader', [headHash]).then((head: any) => {
        return Number.parseInt(head.number)
    })
    checkChainHeight(from, height)
    log?.(`chain height: ${height}`)
    let versions = await findSpecVersions({
        firstBlock: from,
        lastBlock: Math.max(from, height - 1),
        fetch(heights) {
            return fetchVersionsFromChain(client, heights)
        },
        log
    })
    return enrichWithMetadata(client, versions, log)
}


export async function fetchVersionsFromChain(client: ResilientRpcClient, heights: number[]): Promise<SpecVersion[]> {
    let versions: SpecVersion[] = []
    for (let height of heights) {
        let hash = await client.call('chain_getBlockHash', [height])
        let rt = await client.call('chain_getRuntimeVersion', [hash])
        versions.push({
            specName: rt.specName,
            specVersion: rt.specVersion,
            blockNumber: height,
            blockHash: hash
        })
    }
    return versions
}


export async function enrichWithMetadata(client: ResilientRpcClient, versions: SpecVersion[], log?: Log): Promise<SpecVersionWithMetadata[]> {
    let records: SpecVersionWithMetadata[] = []
    for (let v of versions) {
        log?.(`fetching metadata for ${v.specName}@${v.specVersion}`)
        let metadata = await client.call('state_getMetadata', [v.blockHash])
        records.push({...v, metadata})
    }
    return records
}


export function checkChainHeight(from: number, height: number): void {
    if (from > height - 1 && from > 0) {
        throw new Error(`Exploration from block #${from} is not possible. Chain at least should reach the height ${from + 1}`)
    }
}
