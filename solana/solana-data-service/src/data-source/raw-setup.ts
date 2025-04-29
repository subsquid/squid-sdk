import {RpcClient} from '@subsquid/rpc-client'
import {Block, Rpc, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {DataSource} from '@subsquid/util-internal-data-service'
import {GeyserDataSource} from './geyser'


export interface RawDataSourceOptions {
    httpRpc: string
    geyserProxy?: string
    geyserBlockQueueSize?: number
    votes?: boolean
}


export function createDataSource(options: RawDataSourceOptions): DataSource<Block> {
    let httpRpc = new RpcClient({
        url: options.httpRpc,
        capacity: 50,
        fixUnsafeIntegers: true,
        requestTimeout: 20000,
        retryAttempts: 5
    })

    let rpcSource = new SolanaRpcDataSource({
        rpc: new Rpc(httpRpc),
        req: {
            transactions: true,
            rewards: true
        },
        noVotes: !options.votes
    })

    if (options.geyserProxy) {
        let proxy = new RpcClient({
            url: options.geyserProxy,
            requestTimeout: 5000,
            fixUnsafeIntegers: true
        })
        return new GeyserDataSource(
            rpcSource,
            proxy,
            !options.votes,
            options.geyserBlockQueueSize
        )
    } else {
        return rpcSource
    }
}
