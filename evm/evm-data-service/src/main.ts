import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {nat, positiveInt, positiveReal, Url} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {DataSourceOptions} from './data-source/setup'
import {WorkerClient} from './data-source/worker-client'


const log = createLogger('sqd:evm-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for EVM')
    program.requiredOption('--http-rpc <url>', 'HTTP/Websocket RPC url', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.option('--http-rpc-max-batch-call-size <number>', 'Maximum size of RPC batch call', positiveInt)
    program.option('--http-rpc-stride-size <number>', 'The size of ingestion stride', positiveInt, 5)
    program.option('--http-rpc-stride-concurrency <number>', 'Max number of concurrent ingestion strides', positiveInt, 5)
    program.option('--http-rpc-rate-limit <rps>', 'Maximum RPC rate in requests per second', positiveReal)
    program.option('--http-rpc-timeout <ms>', 'RPC client request timeout in ms', nat, 10000)
    program.option('--http-retry-internal-server-errors', 'If set, the internal server errors from the RPC endpoint will be treated as retryable')
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.option('--finality-confirmation <number>', 'Finality offset from the head of a chain', positiveInt)
    program.option('--with-receipts', 'Fetch transaction receipt data')
    program.option('--with-traces', 'Fetch EVM call traces')
    program.option('--with-statediffs', 'Fetch EVM state updates')
    program.option('--use-trace-api', 'Use trace_* API for statediffs and call traces')
    program.option('--use-debug-api-for-statediffs', 'Use debug prestateTracer to fetch statediffs (by default will use trace_* api)')
    program.option('--verify-block-hash', 'Verify block header against block hash')
    program.option('--verify-tx-sender', 'Check if transaction sender matches sender recovered from signature')
    program.option('--verify-tx-root', 'Verify block transactions against transactions root')
    program.option('--verify-receipts-root', 'Verify block receipts against receipts root')
    program.option('--verify-withdrawals-root', 'Verify block withdrawals against withdrawals root')
    program.option('--verify-logs-bloom', 'Verify block logs against logs bloom')
    program.option('--skip-log-index-check', 'Do not check log indices within a block are sequential')
    program.option('--skip-cumulative-gas-used-check', 'Do not check cumulativeGasUsed consistency across transactions')
    program.option('--use-gas-used-for-receipts-root', 'Use gasUsed instead of cumulativeGasUsed for receipts root calculation')
    program.option('--auto-adjust-finalized-head', 'Automatically adjust finalized head when block cache is full and finalized head is not in the new range')
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        httpRpcMaxBatchCallSize: number
        httpRpcStrideSize: number
        httpRpcStrideConcurrency: number
        httpRpcRateLimit?: number
        httpRpcTimeout: number
        httpRetryInternalServerErrors?: boolean
        blockCacheSize: number
        port: number
        finalityConfirmation?: number
        withReceipts?: boolean
        withTraces?: boolean
        withStatediffs?: boolean
        useTraceApi?: boolean
        useDebugApiForStatediffs?: boolean
        verifyBlockHash?: boolean
        verifyTxSender?: boolean
        verifyTxRoot?: boolean
        verifyReceiptsRoot?: boolean
        verifyWithdrawalsRoot?: boolean
        verifyLogsBloom?: boolean
        skipLogIndexCheck?: boolean
        skipCumulativeGasUsedCheck?: boolean
        useGasUsedForReceiptsRoot?: boolean
        autoAdjustFinalizedHead?: boolean
    }

    let dataSourceOptions: DataSourceOptions = {
        httpRpc: args.httpRpc,
        httpRpcMaxBatchCallSize: args.httpRpcMaxBatchCallSize,
        httpRpcStrideSize: args.httpRpcStrideSize,
        httpRpcStrideConcurrency: args.httpRpcStrideConcurrency,
        httpRpcRateLimit: args.httpRpcRateLimit,
        httpRpcTimeout: args.httpRpcTimeout,
        finalityConfirmation: args.finalityConfirmation,
        withReceipts: args.withReceipts,
        withTraces: args.withTraces,
        withStatediffs: args.withStatediffs,
        useTraceApi: args.useTraceApi,
        useDebugApiForStateDiffs: args.useDebugApiForStatediffs,
        verifyBlockHash: args.verifyBlockHash,
        verifyTxSender: args.verifyTxSender,
        verifyTxRoot: args.verifyTxRoot,
        verifyReceiptsRoot: args.verifyReceiptsRoot,
        verifyWithdrawalsRoot: args.verifyWithdrawalsRoot,
        verifyLogsBloom: args.verifyLogsBloom,
        skipLogIndexCheck: args.skipLogIndexCheck,
        skipCumulativeGasUsedCheck: args.skipCumulativeGasUsedCheck,
        useGasUsedForReceiptsRoot: args.useGasUsedForReceiptsRoot
    }

    let mainWorker = new WorkerClient(dataSourceOptions)
    let service: Awaited<ReturnType<typeof runDataService>> | undefined
    let dataSource: DataSource<Block> = {
        getHead() {
            return mainWorker.getHead()
        },
        getFinalizedHead() {
            return mainWorker.getFinalizedHead()
        },
        async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
            let worker = new WorkerClient(dataSourceOptions)
            service?.metrics.incActiveWorkers()
            try {
                yield* worker.getFinalizedStream(req)
            } finally {
                service?.metrics.decActiveWorkers()
                worker.close()
            }
        },
        getStream(req: StreamRequest): BlockStream<Block> {
            return mainWorker.getStream(req)
        }
    }

    service = await runDataService({
        source: dataSource,
        blockCacheSize: args.blockCacheSize,
        port: args.port,
        autoAdjustFinalizedHead: args.autoAdjustFinalizedHead
    })

    log.info(`listening on port ${service.port}`)
    return waitForInterruption(service)
}, err => log.fatal(err))
