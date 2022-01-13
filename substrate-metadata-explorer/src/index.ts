import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {fromChain} from "./fromChain"
import {fromIndexer} from "./fromIndexer"
import type {ChainVersion, Log} from "./types"


export * from "./types"


export interface ExplorationOptions {
    chainEndpoint: string
    archiveEndpoint?: string
    fromBlock?: number
    log?: Log
}


export async function exploreChainVersions(options: ExplorationOptions): Promise<ChainVersion[]> {
    let client = new ResilientRpcClient(options.chainEndpoint)
    try {
        if (options.archiveEndpoint) {
            return await fromIndexer(client, options.archiveEndpoint, options.fromBlock, options.log)
        } else {
            return await fromChain(client, options.fromBlock, options.log)
        }
    } finally {
        client.close()
    }
}
