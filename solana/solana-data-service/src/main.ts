import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {DataSourceOptions, SecondaryDataWorker} from './data-source'
import {Mapping} from './data-source/mapping'
import {createDataSource} from './data-source/raw-setup'


const log = createLogger('sqd:solana-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Solana')
    program.requiredOption('--http-rpc <url>', 'HTTP RPC url', Url(['http:', 'https:']))
    program.option('--geyser-proxy <url>', 'Yellowstone Geyser proxy URL')
    program.option('--geyser-block-queue-size <number>', 'Max queue size of Geyser subscription', positiveInt, 10)
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.option('--votes', 'Include vote transactions (by default all votes are excluded)')
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        geyserProxy?: string
        geyserBlockQueueSize: number
        blockCacheSize: number
        port: number
        votes?: boolean
    }

    let dataSourceOptions: DataSourceOptions = {
        httpRpc: args.httpRpc,
        geyserProxy: args.geyserProxy,
        geyserBlockQueueSize: args.geyserBlockQueueSize,
        votes: args.votes
    }

    let mainWorker = new Mapping(createDataSource(dataSourceOptions))

    let dataSource: DataSource<Block> = {
        getFinalizedHead() {
            return mainWorker.getFinalizedHead()
        },
        async *getFinalizedStream(req: StreamRequest): BlockStream<Block> {
            let worker = new SecondaryDataWorker(dataSourceOptions)
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

    return new Promise((resolve, reject) => {
        waitForInterruption(service).then(resolve, reject)
        service.started.catch(reject)
    })
}, err => log.fatal(err))
