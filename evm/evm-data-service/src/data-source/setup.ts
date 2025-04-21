import { RpcClient } from '@subsquid/rpc-client'
import { getSuggestedChannelsByURL, Rpc } from './evm-rpc'
import { Block, DataSource } from '@subsquid/util-internal-data-service'
import { createLogger } from '@subsquid/logger';
import { EVMRpcDataSource } from './evm-rpc-data-source';
import { Mapping } from './mapping';

const log = createLogger('sqd:evm-data-service/data-source')


export interface DataSourceOptions {
    httpRpc: string
}

export function createDataSource(options: DataSourceOptions): DataSource<Block> {
    let httpRpcClient = new RpcClient({
        url: options.httpRpc,
        capacity: 50,
        fixUnsafeIntegers: true,
        requestTimeout: 16000,
        // retryAttempts: 5,
        // retrySchedule: [500, 1000, 2000, 5000, 10000, 20000],
        // rateLimit: 1,
        log
    })
    let httpRpc = new Rpc(httpRpcClient);
    httpRpc.setChannels(getSuggestedChannelsByURL(options.httpRpc))
    let rpcSource = new EVMRpcDataSource({
        rpc: httpRpc,
        req: {
            transactions: true,
        }
    })
    return new Mapping(rpcSource)
}
