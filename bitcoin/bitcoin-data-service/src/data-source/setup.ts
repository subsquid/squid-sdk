import { RpcClient } from '@subsquid/rpc-client'
import { Rpc, BitcoinRpcDataSource } from '@subsquid/bitcoin-rpc'
import { Block, DataSource } from '@subsquid/util-internal-data-service'
import { createLogger } from '@subsquid/logger'
import { Mapping } from './mapping'


const log = createLogger('sqd:bitcoin-data-service/data-source')


export interface DataSourceOptions {
    httpRpc: string,
    httpRpcMaxBatchCallSize?: number
    httpRpcStrideSize?: number
    httpRpcStrideConcurrency?: number
    httpRpcRateLimit?: number,
    httpRpcTimeout: number,
    finalityConfirmation?: number,
    verifyBlockHash?: boolean
    verifyTxRoot?: boolean
    verifyWitnessCommitment?: boolean
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
        verifyWitnessCommitment: options.verifyWitnessCommitment
    })
    let rpcSource = new BitcoinRpcDataSource({
        rpc: httpRpc,
        req: {
            transactions: true,
        },
        strideSize: options.httpRpcStrideSize,
        strideConcurrency: options.httpRpcStrideConcurrency
    })
    return new Mapping(rpcSource)
}
