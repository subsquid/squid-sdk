import {createLogger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {runProgram} from '@subsquid/util-internal'
import assert from 'assert'
import {findSlot} from './rpc/fetch'
import {Rpc} from './rpc/rpc'


const log = createLogger('solana')


runProgram(async () => {
    let client = new RpcClient({
        url: 'https://api.mainnet-beta.solana.com',
        // url: assertNotNull(process.env.SOLANA_NODE),
        retryAttempts: 5,
        rateLimit: 2,
        retrySchedule: [5000],
        log
    })

    let rpc = new Rpc(client)

    for (let height of [100_000_000, 150_000_000, 200_000_000, 210_000_000]) {
        let result = await findSlot(rpc, height)
        log.info(result)
        let block = await rpc.getBlockInfo('finalized', result.slot)
        assert(result.height == block?.blockHeight)
        log.info('ok')
    }
}, err => log.fatal(err))
