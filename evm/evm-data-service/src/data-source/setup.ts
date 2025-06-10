import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, EvmRpcDataSource} from '@subsquid/evm-rpc'
import {Block, DataSource} from '@subsquid/util-internal-data-service'
import {createLogger} from '@subsquid/logger';
import {Mapping} from './mapping';


const log = createLogger('sqd:evm-data-service/data-source')


export interface DataSourceOptions {
    httpRpc: string,
    ratelimit: number | undefined,
    traces: boolean | undefined,
    diffs: boolean | undefined,
    receipts: boolean | undefined,
}


export function createDataSource(options: DataSourceOptions): DataSource<Block> {
    let httpRpcClient = new RpcClient({
        url: options.httpRpc,
        capacity: 50,
        fixUnsafeIntegers: true,
        requestTimeout: 16000,
        // retryAttempts: 5,
        // retrySchedule: [500, 1000, 2000, 5000, 10000, 20000],
        rateLimit: options.ratelimit,
        log
    })
    let httpRpc = new Rpc(httpRpcClient);
    let rpcSource = new EvmRpcDataSource({
        rpc: httpRpc,
        req: {
            transactions: true,
            receipts: options.receipts,
            traces: options.traces,
            stateDiffs: options.diffs,
        }
    })
    return new Mapping(rpcSource)
}
