import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {Command} from 'commander'

const log = createLogger('sqd:solana-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Solana')
    program.requiredOption('--http-rpc <url>', 'HTTP RPC url', Url(['http:', 'https:']))
    // program.option('--ws-rpc <url>', 'Websocket RPC url', Url(['ws:', 'wss:']))
    // program.option('--geyser-rpc <url>', 'Yellowstone gRPC url')
    // program.option('--geyser-rpc-token <string>', 'gRPC xToken')
    // program.option('--geyser-block-queue-size <number>', 'Max queue size of Geyser subscription', positiveInt, 10)
    // program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'Port to listen on', positiveInt, 3000)
    // program.option('--votes', 'Include vote transactions (by default all votes are excluded)')
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        wsRpc?: string
        geyserRpc?: string
        geyserRpcToken?: string
        geyserBlockQueueSize: number
        blockCacheSize: number
        port: number
        votes?: boolean
    }

    log.info(`Args ${args}`)

}, err => log.fatal(err))
