import { run} from '@subsquid/batch-processor'
import { augmentBlock } from '@subsquid/starknet-objects'
import { DataSourceBuilder } from '@subsquid/starknet-stream'
import { TypeormDatabase } from '@subsquid/typeorm-store'
import { createLogger } from '@subsquid/logger'
import { Transfer } from './model'

let logger = createLogger('sqd:indexer')

const dataSource = new DataSourceBuilder()
    .setGateway('https://v2.archive.subsquid.io/network/starknet-mainnet')
    .setBlockRange({from: 500_000, to: 501_000})
    .setFields({
        event: {
            keys: true
        }
    })
    .addEvent({
        fromAddress: ['0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8'],
        key0: ['0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9'] // Transfer
    })
    .build()

const database = new TypeormDatabase()

run(dataSource, database, async ctx => {
    let blocks = ctx.blocks.map(augmentBlock)
    const transfers: Transfer[] = []
    for (let block of blocks) {
        if (!block.events) continue
        for (let event of block.events) {
            if (!event.key3) {
                throw new Error('event.key3 is missing')
            }
            let {from, to, amount} = {from: event.key1, to: event.key2, amount: BigInt(event.key3)}
            transfers.push(new Transfer({
                id: event.id,
                from, to, amount
            }))
        }
    }
    await ctx.store.insert(transfers)
})