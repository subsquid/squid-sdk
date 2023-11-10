import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, runProgram} from '@subsquid/util-internal'
import {Rpc} from './ds-rpc/rpc'


const log = createLogger('test')


runProgram(async () => {
    let rpc = new Rpc(new RpcClient({
        url: assertNotNull(process.env.ETH_NODE_WS),
        retryAttempts: Number.MAX_SAFE_INTEGER
    }))

    return new Promise((resolve, reject) => {
        rpc.subscribeNewHeads({
            onNewHead(head) {
                log.info(head, 'new head')
                rpc.getBlockByHash(head.hash, false).then(
                    block => log.info(block || undefined, 'get block')
                ).catch(resolve)
            },
            onError: reject
        })
    })
}, err => log.fatal(err))
