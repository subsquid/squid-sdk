import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {Block, BlockStream, DataSource, runDataService, StreamRequest} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {DataSourceOptions} from './data-source/setup'
import {WorkerClient} from './data-source/worker-client'


const log = createLogger('sqd:solana-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Solana')
    program.requiredOption('--http-rpc <url>', 'HTTP RPC url', Url(['http:', 'https:']))
    program.option('--ws-rpc <url>', 'Websocket RPC url', Url(['ws:', 'wss:']))
    program.option('--geyser-rpc <url>', 'Yellowstone gRPC url')
    program.option('--geyser-rpc-token <string>', 'gRPC xToken')
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    program.option('--votes', 'Include vote transactions (by default all votes are excluded)')
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        wsRpc?: string
        geyserRpc?: string
        geyserRpcToken?: string
        blockCacheSize: number
        port: number
        votes?: boolean
    }

    let dataSourceOptions: DataSourceOptions = {
        httpRpc: args.httpRpc,
        geyserRpc: args.geyserRpc,
        geyserRpcToken: args.geyserRpcToken,
        votes: args.votes
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
        source: dataSource, // createDataSource(dataSourceOptions),
        blockCacheSize: args.blockCacheSize,
        port: args.port
    })

    return waitForInterruption(service)
}, err => log.fatal(err))
