import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/tron-objects'
import {DataSourceBuilder} from '@subsquid/tron-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = 'a614f803b6fd780986a42c78ec9c7f77e6ded13c'
const TOPIC0 = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'


const dataSource = new DataSourceBuilder()
    .setGateway('https://v2.archive.subsquid.io/network/tron-mainnet')
    .setBlockRange({from: 11322942, to: 11323358})
    .addLog({
        where: {
            address: [CONTRACT],
            topic0: [TOPIC0]
        },
        include: {
            transaction: true
        }
    })
    .build()


const database = new TypeormDatabase()


run(dataSource, database, async ctx => {
    let transfers: Transfer[] = []

    let blocks = ctx.blocks.map(augmentBlock)

    for (let block of blocks) {
        for (let log of block.logs) {
            if (log.address == CONTRACT && log.topics[0] === TOPIC0) {
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
