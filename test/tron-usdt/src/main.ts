import {TronBatchProcessor} from '@subsquid/tron-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = 'a614f803b6fd780986a42c78ec9c7f77e6ded13c'
const TOPIC0 = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'


const processor = new TronBatchProcessor()
    .setGateway('https://v2.archive.subsquid.io/network/tron-mainnet')
    .setHttpApi({
        url: 'https://rpc.ankr.com/http/tron',
        strideConcurrency: 1,
        strideSize: 1,
    })
    .setBlockRange({from: 65797512})
    .addLog({
        where: {
            address: [CONTRACT],
            topic0: [TOPIC0]
        },
        include: {
            transaction: true
        }
    })


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address == CONTRACT && log.topics?.[0] === TOPIC0) {
                assert(log.data)
                let event = {
                    topics: log.topics.map(t => '0x' + t),
                    data: '0x' + log.data
                }
                let {from, to, value} = erc20.events.Transfer.decode(event)
                let tx = log.getTransaction()

                transfers.push(new Transfer({
                    id: log.id,
                    blockNumber: block.header.height,
                    timestamp: new Date(block.header.timestamp),
                    tx: tx.hash,
                    from,
                    to,
                    amount: value
                }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
