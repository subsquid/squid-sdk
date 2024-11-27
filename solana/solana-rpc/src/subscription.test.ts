import {RpcClient} from '@subsquid/rpc-client'
import {assertNotNull, runProgram} from '@subsquid/util-internal'
import {PollStream} from './ingest/poll-stream'
import {Rpc} from './rpc'
import {subscribeNewBlocks} from './subscribe-new-blocks'


runProgram(async () => {
    let prev = 0

    let client = new RpcClient({
        url: assertNotNull(process.env.SOLANA_BLOCKJOY)
    })

    // let rpc = new Rpc(client)
    //
    // let {context: {slot: start}} = await rpc.getLatestBlockhash('confirmed')

    //
    // let stream = new PollStream({
    //     rpc,
    //     commitment: 'confirmed',
    //     req: {transactions: false, rewards: false},
    //     from: start
    // })
    //
    // while (true) {
    //     let batch = await stream.next()
    //     for (let b of batch) {
    //         let height = assertNotNull(b.block.blockHeight)
    //         let timeDiff = Math.round(Date.now() / 1000) - assertNotNull(b.block.blockTime)
    //         console.log(`diff: ${height - prev}, slot: ${b.slot}, delay: ${timeDiff} secs`)
    //         prev = height
    //     }
    // }

    return new Promise((resolve, reject) => {
        subscribeNewBlocks(client, 'confirmed', {transactions: false, rewards: false}, msg => {
            if (msg instanceof Error) {
                reject(msg)
            } else {
                let height = assertNotNull(msg.block.blockHeight)
                let timeDiff = Math.round(Date.now() / 1000) - assertNotNull(msg.block.blockTime)
                console.log(`diff: ${height - prev}, slot: ${msg.slot}, delay: ${timeDiff} secs`)
                prev = height
            }
        })
    })
})
