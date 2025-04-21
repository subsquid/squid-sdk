import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'

import {DataSourceOptions} from './data-source/setup'
import {WorkerClient} from './data-source/worker-client'

const log = createLogger('sqd:evm-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for EVM')
    program.requiredOption('--http-rpc <url>', 'HTTP RPC url', Url(['http:', 'https:']))
    program.option('--ws-rpc <url>', 'Websocket RPC url', Url(['ws:', 'wss:']))
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        wsRpc?: string
        blockCacheSize: number
        port: number
    }

    let dataSourceOptions: DataSourceOptions = {
        httpRpc: args.httpRpc
    }

    let mainWorker = new WorkerClient(dataSourceOptions)
    let dataSource: DataSource<Block> = {
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
