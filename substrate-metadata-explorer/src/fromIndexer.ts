import type {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import assert from "assert"
import fetch from "node-fetch"
import {Explorer, Version} from "./explorer"
import {checkChainHeight, fetchVersionMetadata, fetchVersionsFromChain} from "./fromChain"
import type {ChainVersion, Log} from "./types"


export async function fromIndexer(
    chainClient: ResilientRpcClient,
    indexerUrl: string,
    from: number = 0,
    log?: Log
): Promise<ChainVersion[]> {
    let height: number = await indexerRequest(indexerUrl, `
        query {
            indexerStatus {
                head
            }
        }
    `).then(res => res.indexerStatus.head)

    checkChainHeight(from, height)
    log?.(`chain height: ${height}`)

    let versions = await Explorer.getVersions(from, height, heights => {
        return fetchVersionsFromIndexer(chainClient, indexerUrl, heights)
    }, log)

    return fetchVersionMetadata(chainClient, versions, log)
}


async function fetchVersionsFromIndexer(chainClient: ResilientRpcClient, indexerUrl: string, heights: number[]): Promise<Version[]> {
    let response: {substrate_block: Version[]} = await indexerRequest(
        indexerUrl,
        `query {
            substrate_block(where: {height: {_in: [${heights.join(', ')}]}}) {
                specVersion: runtimeVersion(path: "$.specVersion") 
                blockNumber: height 
                blockHash: hash
            }
         }`
    )

    let mapping = new Map(response.substrate_block.map(v => [v.blockNumber, v]))

    if (mapping.size != heights.length) {
        // Workaround for some indexers, which don't start from block 0 for historical reasons
        let missing = heights.filter(h => !mapping.has(h))
        let missingVersions = await fetchVersionsFromChain(chainClient, missing)
        missingVersions.forEach(v => mapping.set(v.blockNumber, v))
    }

    return heights.map(h => assertNotNull(mapping.get(h)))
}


async function indexerRequest<T=any>(indexerUrl: string, query: string): Promise<T> {
    let response = await fetch(indexerUrl, {
        method: 'POST',
        body: JSON.stringify({query}),
        headers: {
            'content-type': 'application/json',
            'accept': 'application/json',
            'accept-encoding': 'gzip, br'
        }
    })
    if (!response.ok) {
        throw new Error(`Got http ${response.status}, body: ${await response.text()}`)
    }
    let result = await response.json()
    return result.data as T
}


function assertNotNull<T>(val?: T | null, msg?: string): T {
    assert(val != null, msg)
    return val
}
