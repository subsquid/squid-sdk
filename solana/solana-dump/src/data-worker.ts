import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {getServer, getServerArguments} from '@subsquid/util-internal-worker-thread'
import type {Options} from './dumper'


const options: Options = getServerArguments()


const rpc = new RpcClient({
    url: options.endpoint,
    capacity: options.strideConcurrency + 10,
    requestTimeout: 60_000,
    retryAttempts: Number.MAX_SAFE_INTEGER,
    fixUnsafeIntegers: true
})


const dataSource = new SolanaRpcDataSource({
    rpc: new Rpc(rpc),
    req: {transactions: true, rewards: true},
    strideSize: options.strideSize,
    strideConcurrency: options.strideConcurrency,
    maxConfirmationAttempts: options.maxConfirmationAttempts
})


getServer()
    .def('getFinalizedHead', () => dataSource.getFinalizedHead())
    .def('getFinalizedStream', req => dataSource.getFinalizedStream(req))
    .def('getStream', req => dataSource.getStream(req))
    .start()
