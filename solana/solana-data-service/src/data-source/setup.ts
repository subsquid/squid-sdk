import type {RpcMetrics} from '@subsquid/rpc-client'
import {Block as RpcBlock, RemoteRpcOptions, RemoteRpcPool, RpcApi, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {Block, DataSource} from '@subsquid/util-internal-data-service'
import {GeyserDataSource} from './geyser-data-source'
import {RemoteGeyser} from './geyser-remote'
import {Mapping} from './mapping'


export interface DataSourceOptions {
    httpRpc: string
    httpRpcStrideSize: number
    httpRpcStrideConcurrency: number
    httpRpcMaxConfirmationAttempts: number
    httpRpcWorkers: number
    geyserProxy?: string
    geyserBlockQueueSize?: number
    votes?: boolean
}


/** A data source together with the metrics of the RPC clients (in worker threads) it fetches through. */
export interface DataSourceSetup {
    source: DataSource<Block>
    getRpcMetrics(): Promise<RpcMetrics>
}


export function createMainDataSource(options: DataSourceOptions): DataSourceSetup {
    let rpc = new RemoteRpcPool(options.httpRpcWorkers, createRpcOptions(options))

    let rpcDataSource = createSolanaRpcDataSource(rpc, options)

    let raw: DataSource<RpcBlock> = rpcDataSource

    if (options.geyserProxy) {
        let geyser = new RemoteGeyser({
            geyserProxy: options.geyserProxy,
            geyserBlockQueueSize: options.geyserBlockQueueSize
        })
        raw = new GeyserDataSource(rpcDataSource, geyser)
    }

    return {source: new Mapping(raw, !!options.votes), getRpcMetrics: () => rpc.getRpcMetrics()}
}


export function createSecondaryDataSource(options: DataSourceOptions): DataSourceSetup {
    let rpc = new RemoteRpcPool(options.httpRpcWorkers, createRpcOptions(options))
    let raw = createSolanaRpcDataSource(rpc, options)
    return {source: new Mapping(raw, !!options.votes), getRpcMetrics: () => rpc.getRpcMetrics()}
}


function createRpcOptions(options: DataSourceOptions): RemoteRpcOptions {
    return {
        url: options.httpRpc,
        capacity: Number.MAX_SAFE_INTEGER,
        requestTimeout: 10_000,
        retryAttempts: 5,
        noVotes: !options.votes
    }
}


function createSolanaRpcDataSource(rpc: RpcApi, options: DataSourceOptions): SolanaRpcDataSource {
    return new SolanaRpcDataSource({
        rpc,
        req: {transactions: true, rewards: true},
        strideSize: options.httpRpcStrideSize,
        strideConcurrency: options.httpRpcStrideConcurrency,
        maxConfirmationAttempts: options.httpRpcMaxConfirmationAttempts
    })
}
