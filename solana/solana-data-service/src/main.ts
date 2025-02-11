import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, SolanaRpcDataSource} from '@subsquid/solana-rpc'
import {runProgram} from '@subsquid/util-internal'
import {positiveInt, Url} from '@subsquid/util-internal-commander'
import {runDataService} from '@subsquid/util-internal-data-service'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {Source} from './source'


const log = createLogger('sqd:solana-data-service')


runProgram(async () => {
    let program = new Command()
    program.description('Hot block data service for Solana')
    program.requiredOption('--http-rpc <url>', 'HTTP RPC url', Url(['http:', 'https:']))
    program.option('--http-rpc-capacity <number>', 'Maximum number of pending HTTP RPC requests allowed', positiveInt, 100)
    program.option('--ws-rpc <url>', 'Websocket RPC url', Url(['ws:', 'wss:']))
    program.option('--geyser-rpc <url>', 'Yellowstone gRPC url')
    program.option('--block-cache-size <number>', 'Max number of blocks to buffer', positiveInt, 1000)
    program.option('-p, --port <number>', 'port to listen on', positiveInt, 3000)
    program.parse()

    let args = program.opts() as {
        httpRpc: string
        httpRpcCapacity: number
        wsRpc?: string
        geyserRpc?: string
        blockCacheSize: number
        port: number
    }

    let httpRpc = new RpcClient({
        url: args.httpRpc,
        capacity: args.httpRpcCapacity,
        fixUnsafeIntegers: true
    })

    let rpcSource = new SolanaRpcDataSource({
        rpc: new Rpc(httpRpc),
        req: {
            transactions: true,
            rewards: true
        }
    })

    // let websocketRpc = args.wsRpc == null ? undefined : new RpcClient({
    //     url: args.wsRpc,
    //     fixUnsafeIntegers: true
    // })

    let source = new Source(rpcSource)

    let service = await runDataService({
        source,
        blockCacheSize: args.blockCacheSize,
        port: args.port
    })

    return waitForInterruption(service)
}, err => log.fatal(err))
