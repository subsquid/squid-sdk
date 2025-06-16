import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {DataSourceOptions, MainDataSource, SecondaryDataSource} from './data-source'


const log = createLogger('sqd:solana-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Solana')
    program.requiredOption('--http-rpc <url>', 'HTTP RPC url', Url(['http:', 'https:']))
    program.option('--http-rpc-stride-size <number>', 'The size of getBlock batch call', positiveInt, 5)
    program.option('--http-rpc-stride-concurrency <number>', 'Max number of concurrent getBlock batch calls', positiveInt, 5)
    program.option('--http-rpc-max-confirmation-attempts <number>', 'Max number of getBlock retries for missing block', positiveInt, 10)
    program.option('--http-rpc-workers <number>', 'Number of worker threads to use for RPC requests', positiveInt, 5)
    program.option('--geyser-proxy <url>', 'Yellowstone Geyser proxy URL')
    program.option('--geyser-block-queue-size <number>', 'Max queue size of Geyser subscription', positiveInt, 10)
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.option('--votes', 'Include vote transactions (by default all votes are excluded)')
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        httpRpcStrideSize: number
        httpRpcStrideConcurrency: number
        httpRpcMaxConfirmationAttempts: number
        httpRpcWorkers: number
        geyserProxy?: string
        geyserBlockQueueSize: number
        blockCacheSize: number
        port: number
        votes?: boolean
    }

    let dataSourceOptions: DataSourceOptions = {
        httpRpc: args.httpRpc,
        httpRpcStrideSize: args.httpRpcStrideSize,
        httpRpcStrideConcurrency: args.httpRpcStrideConcurrency,
        httpRpcMaxConfirmationAttempts: args.httpRpcMaxConfirmationAttempts,
        httpRpcWorkers: args.httpRpcWorkers,
        geyserProxy: args.geyserProxy,
        geyserBlockQueueSize: args.geyserBlockQueueSize,
        votes: args.votes
    }

    let mainWorker = new MainDataSource(dataSourceOptions)

    let dataSource: DataSource<Block> = {
        getHead() {
            return mainWorker.getHead()
        },
        getFinalizedHead() {
            return mainWorker.getFinalizedHead()
        },
        async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
            let worker = new SecondaryDataSource(dataSourceOptions)
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
        dataset: 'solana',
        network: 'mainnet',
        port: args.port
    })

    log.info(`listening on port ${service.port}`)

    return new Promise((resolve, reject) => {
        waitForInterruption(service).then(resolve, reject)
        service.started.catch(reject)
    })
}, err => log.fatal(err))
