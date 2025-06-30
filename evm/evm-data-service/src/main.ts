import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import 'source-map-support/register'
import {DataSourceOptions} from './data-source/setup'
import {WorkerClient} from './data-source/worker-client'


const log = createLogger('sqd:evm-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for EVM')
    program.requiredOption('--http-rpc <url>', 'HTTP/Websocket RPC url', Url(['http:', 'https:', 'ws:', 'wss:']))
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.option('-r, --ratelimit <number>', 'Ratelimit', positiveInt)
    program.option('--traces', 'Force enable traces')
    program.option('--no-traces', "Force disable traces")
    program.option('--diffs', 'Force enable diffs')
    program.option('--no-diffs', "Force disable diffs")
    program.option('--receipts', 'Force enable receipts')
    program.option('--no-receipts', "Force disable receipts")
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        wsRpc?: string
        blockCacheSize: number
        port: number,
        traces?: boolean,
        diffs?: boolean,
        receipts?: boolean
        ratelimit?: number
    }

    let dataSourceOptions: DataSourceOptions = {
        httpRpc: args.httpRpc,
        traces: args.traces,
        diffs: args.diffs,
        receipts: args.receipts,
        ratelimit: args.ratelimit
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
