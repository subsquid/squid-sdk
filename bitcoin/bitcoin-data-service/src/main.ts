import { createLogger } from '@subsquid/logger'
import { runProgram } from '@subsquid/util-internal'
import { nat, positiveInt, positiveReal, Url } from '@subsquid/util-internal-commander'
import { Block, BlockStream, DataSource, runDataService, StreamRequest } from '@subsquid/util-internal-data-service'
import { waitForInterruption } from '@subsquid/util-internal-http-server'
import { Command } from 'commander'
import 'source-map-support/register'
import { DataSourceOptions } from './data-source/setup'
import { WorkerClient } from './data-source/worker-client'
import { DEFAULT_FINALITY_CONFIRMATION } from '@subsquid/bitcoin-rpc'


const log = createLogger('sqd:bitcoin-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Bitcoin')
    program.requiredOption('--http-rpc <url>', 'HTTP/Websocket RPC url', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.option('--http-rpc-max-batch-call-size <number>', 'Maximum size of RPC batch call', positiveInt)
    program.option('--http-rpc-stride-size <number>', 'The size of ingestion stride', positiveInt, 5)
    program.option('--http-rpc-stride-concurrency <number>', 'Max number of concurrent ingestion strides', positiveInt, 5)
    program.option('--http-rpc-rate-limit <rps>', 'Maximum RPC rate in requests per second', positiveReal)
    program.option('--http-rpc-timeout <ms>', 'RPC client request timeout in ms', nat, 10000)
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.option('--finality-confirmation <number>', 'Finality offset from the head of a chain', positiveInt, DEFAULT_FINALITY_CONFIRMATION)
    program.option('--verify-block-hash', 'Verify block header against block hash')
    program.option('--verify-tx-root', 'Verify block transactions against transactions root')
    program.option('--verify-witness-commitment', 'Verify witness commitment in coinbase transaction')
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        httpRpcMaxBatchCallSize: number
        httpRpcStrideSize: number
        httpRpcStrideConcurrency: number
        httpRpcRateLimit?: number
        httpRpcTimeout: number
        blockCacheSize: number
        port: number
        finalityConfirmation: number
        verifyBlockHash?: boolean
        verifyTxRoot?: boolean
        verifyWitnessCommitment?: boolean
    }

    let dataSourceOptions: DataSourceOptions = {
        httpRpc: args.httpRpc,
        httpRpcMaxBatchCallSize: args.httpRpcMaxBatchCallSize,
        httpRpcStrideSize: args.httpRpcStrideSize,
        httpRpcStrideConcurrency: args.httpRpcStrideConcurrency,
        httpRpcRateLimit: args.httpRpcRateLimit,
        httpRpcTimeout: args.httpRpcTimeout,
        finalityConfirmation: args.finalityConfirmation,
        verifyBlockHash: args.verifyBlockHash,
        verifyTxRoot: args.verifyTxRoot,
        verifyWitnessCommitment: args.verifyWitnessCommitment
    }

    let mainWorker = new WorkerClient(dataSourceOptions)
    let dataSource: DataSource<Block> = {
        getHead() {
            return mainWorker.getHead()
        },
        getFinalizedHead() {
            return mainWorker.getFinalizedHead()
        },
        async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
            let worker = new WorkerClient(dataSourceOptions)
            try {
                yield* worker.getFinalizedStream(req)
            } finally {
                worker.close()
            }
        },
        getStream(req: StreamRequest): BlockStream<Block> {
            return mainWorker.getStream(req)
        }
    }

    let service = await runDataService({
        source: dataSource,
        blockCacheSize: args.blockCacheSize,
        port: args.port
    })

    log.info(`listening on port ${service.port}`)
    return waitForInterruption(service)
}, err => log.fatal(err))
