import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {nat, positiveInt, Url} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {DataSourceOptions} from './data-source/setup'
import {WorkerClient} from './data-source/worker-client'


const log = createLogger('sqd:tron-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for TRON')
    program.requiredOption('--http-api <url>', 'TRON FullNode HTTP API url', Url(['http:', 'https:']))
    program.option('--http-api-stride-size <number>', 'The size of ingestion stride', positiveInt, 5)
    program.option('--http-api-stride-concurrency <number>', 'Max number of concurrent ingestion strides', positiveInt, 5)
    program.option('--http-api-timeout <ms>', 'HTTP API request timeout in ms', nat, 30000)
    program.option('--http-api-head-poll-interval <ms>', 'Interval between head polls in ms', positiveInt, 1000)
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.option('--auto-adjust-finalized-head', 'Automatically adjust finalized head when block cache is full and finalized head is not in the new range')
    program.parse()

    let args = program.opts() as {
        httpApi: string
        httpApiStrideSize: number
        httpApiStrideConcurrency: number
        httpApiTimeout: number
        httpApiHeadPollInterval: number
        blockCacheSize: number
        port: number
        autoAdjustFinalizedHead?: boolean
    }

    let dataSourceOptions: DataSourceOptions = {
        httpApi: args.httpApi,
        httpApiStrideSize: args.httpApiStrideSize,
        httpApiStrideConcurrency: args.httpApiStrideConcurrency,
        httpApiTimeout: args.httpApiTimeout,
        httpApiHeadPollInterval: args.httpApiHeadPollInterval
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
