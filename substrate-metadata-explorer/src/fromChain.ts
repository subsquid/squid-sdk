import type {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {Explorer, Version} from "./explorer"
import {ChainVersion, Log} from "./types"


export async function fromChain(client: ResilientRpcClient, from: number = 0, log?: Log): Promise<ChainVersion[]> {
    let headHash = await client.call('chain_getFinalizedHead')
    let height = await client.call('chain_getHeader', [headHash]).then((head: any) => {
        return Number.parseInt(head.number)
    })
    checkChainHeight(from, height)
    log?.(`chain height: ${height}`)
    let versions = await Explorer.getVersions(from, Math.max(from, height - 1), heights => {
        return fetchVersionsFromChain(client, heights)
    }, log)
    return fetchVersionMetadata(client, versions, log)
}


export async function fetchVersionsFromChain(client: ResilientRpcClient, heights: number[]): Promise<Version[]> {
    let versions: Version[] = []
    for (let height of heights) {
        let hash = await client.call('chain_getBlockHash', [height])
        let rt = await client.call('chain_getRuntimeVersion', [hash])
        versions.push({
            blockNumber: height,
            blockHash: hash,
            specVersion: rt.specVersion
        })
    }
    return versions
}


export async function fetchVersionMetadata(client: ResilientRpcClient, versions: Version[], log?: Log): Promise<ChainVersion[]> {
    let records: ChainVersion[] = []
    for (let v of versions) {
        log?.(`fetching metadata for version ${v.specVersion}`)
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
