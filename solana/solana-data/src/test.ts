import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, runProgram} from '@subsquid/util-internal'
import {RpcDataSource} from './rpc'


const log = createLogger('solana')


runProgram(async () => {
    let client = new RpcClient({
        url: assertNotNull(process.env.SOLANA_NODE),
        retryAttempts: 100,
        log
    })

    let src = new RpcDataSource({
        rpc: client
    })

    for await (let batch of src.getFinalizedBlocks([{
        range: {from: 200_010_000, to: 200_010_001},
        request: {transactions: true, rewards: true}
    }])) {
        for (let block of batch.blocks) {
            console.log(JSON.stringify(block))
        }
    }
}, err => log.fatal(err))
