import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {DataSourceOptions} from './data-source/setup'
import {WorkerClient} from './data-source/worker-client'


const log = createLogger('sqd:hyperliquid-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Hyperliquid replica cmds')
    program.requiredOption('--gateway-proxy <url>', 'Hyperliquid gateway proxy URL')
    program.option('--gateway-block-queue-size <number>', 'Max queue size of gateway subscription', positiveInt, 10)
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.parse()

    let args = program.opts() as {
        gatewayProxy: string
        gatewayBlockQueueSize: number
        blockCacheSize: number
        port: number
    }

    let dataSourceOptions: DataSourceOptions = {
        gatewayProxy: args.gatewayProxy,
        gatewayBlockQueueSize: args.gatewayBlockQueueSize
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
