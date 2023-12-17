import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {addErrorContext, assertNotNull, runProgram} from '@subsquid/util-internal'
import {mapRpcBlock} from './normalization'
import {getBlockCtx, RpcDataSource} from './rpc'


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
        range: {from: 200_000_000, to: 200_010_000},
        request: {transactions: true, rewards: false}
    }])) {
        for (let block of batch.blocks) {
            try {
                console.log(JSON.stringify(mapRpcBlock(block)))
            } catch(err: any) {
                throw addErrorContext(err, getBlockCtx(block))
            }
        }
    }
}, err => log.fatal(err))
