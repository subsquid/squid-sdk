import type {RpcClient} from "@subsquid/rpc-client"
import {Version, Explorer} from "./explorer"
import {ChainVersion, Log} from "./types"


export async function fromChain(client: RpcClient, from: number = 0, log?: Log): Promise<ChainVersion[]> {
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


export async function fetchVersionsFromChain(client: RpcClient, heights: number[]): Promise<Version[]> {
    let hashes = checkBatch(await client.batch(
        heights.map(h => {
            return ['chain_getBlockHash', [h]]
        })
    ))

    let runtimeVersions = checkBatch(await client.batch(
        hashes.map(hash => {
            return ['chain_getRuntimeVersion', [hash]]
        })
    ))

    return runtimeVersions.map((v, idx) => {
        return {
            blockNumber: heights[idx],
            blockHash: hashes[idx],
            specVersion: v.specVersion
        }
    })
}


function checkBatch<T>(batchResponse: (T | Error)[]): T[] {
    for (let i = 0; i < batchResponse.length; i++) {
        let res = batchResponse[i]
        if (res instanceof Error) {
            throw res
        }
    }
    return batchResponse as T[]
}


export async function fetchVersionMetadata(client: RpcClient, versions: Version[], log?: Log): Promise<ChainVersion[]> {
    let records: ChainVersion[] = []
    while (versions.length) {
        let batch = versions.slice(0, 10)
        versions = versions.slice(10)
        log?.(`fetching metadata for versions ${batch[0].specVersion}..${batch[batch.length - 1].specVersion}`)

        let hashes: string[] = checkBatch(await client.batch(
            batch.map(v => {
                return ['chain_getBlockHash', [v.blockNumber]]
            })
        ))

        for (let i = 0; i < hashes.length; i++) {
            let metadata = await client.call('state_getMetadata', [hashes[i]])
            records.push({
                ...batch[i],
                metadata
            })
        }
    }
    return records
}


export function checkChainHeight(from: number, height: number): void {
    if (from > height - 1 && from > 0) {
        throw new Error(`Exploration from block #${from} is not possible. Chain at least should reach the height ${from + 1}`)
    }
}
