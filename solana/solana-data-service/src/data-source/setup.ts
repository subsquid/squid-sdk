import {RpcClient} from '@subsquid/rpc-client'
import {Block as RpcBlock, Rpc, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Block, DataSource} from '@subsquid/util-internal-data-service'
import {GeyserDataSource} from './geyser'
import {Mapping} from './mapping'


export interface DataSourceOptions {
    httpRpc: string
    geyserProxy?: string
    geyserBlockQueueSize?: number
    votes?: boolean
}


export function createDataSource(options: DataSourceOptions): DataSource<Block> {
    let httpRpc = new RpcClient({
        url: options.httpRpc,
        capacity: 50,
        fixUnsafeIntegers: true,
        requestTimeout: 16000,
        retryAttempts: 5
    })

    let rpcSource = new SolanaRpcDataSource({
        rpc: new Rpc(httpRpc),
        req: {
            transactions: true,
            rewards: true
        }
    })

    let source: DataSource<RpcBlock>
    if (options.geyserProxy) {
        let client = new RpcClient({
            url: options.geyserProxy,
            fixUnsafeIntegers: true
        })
        source = new GeyserDataSource(
            rpcSource,
            client,
            !options.votes,
            options.geyserBlockQueueSize
        )
    } else {
        source = rpcSource
    }

    return new Mapping(source, options.votes)
}
