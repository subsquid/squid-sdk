import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Block, DataSource} from '@subsquid/util-internal-data-service'
import {Mapping} from './mapping'


export interface DataSourceOptions {
    httpRpc: string
    votes?: boolean
}


export function createDataSource(options: DataSourceOptions): DataSource<Block> {
    let httpRpc = new RpcClient({
        url: options.httpRpc,
        capacity: 50,
        fixUnsafeIntegers: true
    })

    let rpcSource = new SolanaRpcDataSource({
        rpc: new Rpc(httpRpc),
        req: {
            transactions: true,
            rewards: true
        }
    })

    return new Mapping(rpcSource, options.votes)
}
