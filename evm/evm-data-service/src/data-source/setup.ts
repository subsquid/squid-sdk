import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, EvmRpcDataSource} from '@subsquid/evm-rpc'
import {Block, DataSource} from '@subsquid/util-internal-data-service'
import {createLogger} from '@subsquid/logger';
import {Mapping} from './mapping';


const log = createLogger('sqd:evm-data-service/data-source')


export interface DataSourceOptions {
    httpRpc: string,
    httpRpcMaxBatchCallSize?: number
    httpRpcStrideSize?: number
    httpRpcStrideConcurrency?: number
    httpRpcRateLimit?: number,
    httpRpcTimeout: number,
    finalityConfirmation?: number,
    traces?: boolean,
    diffs?: boolean,
    receipts?: boolean,
    useTraceApi?: boolean,
    useDebugApiForStateDiffs?: boolean
    verifyBlockHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyLogsBloom?: boolean
}


export function createDataSource(options: DataSourceOptions): DataSource<Block> {
    let httpRpcClient = new RpcClient({
        url: options.httpRpc,
        maxBatchCallSize: options.httpRpcMaxBatchCallSize,
        capacity: Number.MAX_SAFE_INTEGER,
        rateLimit: options.httpRpcRateLimit,
        requestTimeout: options.httpRpcTimeout,
        retryAttempts: 5,
        log
    })
    let httpRpc = new Rpc({
        client: httpRpcClient,
        finalityConfirmation: options.finalityConfirmation,
        verifyBlockHash: options.verifyBlockHash,
        verifyTxRoot: options.verifyTxRoot,
        verifyTxSender: options.verifyTxSender,
        verifyReceiptsRoot: options.verifyReceiptsRoot,
        verifyLogsBloom: options.verifyLogsBloom
    })
    let rpcSource = new EvmRpcDataSource({
        rpc: httpRpc,
        req: {
            transactions: true,
            logs: !options.receipts,
            receipts: options.receipts,
            traces: options.traces,
            stateDiffs: options.diffs,
            useTraceApi: options.useTraceApi,
            useDebugApiForStateDiffs: options.useDebugApiForStateDiffs,
            debugTraceTimeout: '60s',
        },
        strideSize: options.httpRpcStrideSize,
        strideConcurrency: options.httpRpcStrideConcurrency
    })
    return new Mapping(rpcSource, options.traces, options.diffs)
}
