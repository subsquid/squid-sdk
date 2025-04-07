import {RpcClient} from '@subsquid/rpc-client'
import {Block as RpcBlock, Rpc, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Block, DataSource} from '@subsquid/util-internal-data-service'
import GeyserClient from '@subsquid/util-internal-geyser-client'
import {GeyserDataSource} from './geyser'
import {Mapping} from './mapping'


export interface DataSourceOptions {
    httpRpc: string
    geyserRpc?: string
    geyserRpcToken?: string
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
    if (options.geyserRpc) {
        let client = new GeyserClient(options.geyserRpc, options.geyserRpcToken, {
            'grpc.max_receive_message_length': 128 * 1024 * 1024, // 128MiB
            'grpc.default_compression_algorithm': 2 // gzip
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
