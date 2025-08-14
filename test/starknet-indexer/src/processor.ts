import { run} from '@subsquid/batch-processor'
import { augmentBlock } from '@subsquid/starknet-objects'
import { DataSourceBuilder, StarknetRpcClient } from '@subsquid/starknet-stream'
import { TypeormDatabase } from '@subsquid/typeorm-store'
import { createLogger } from '@subsquid/logger'
import { Transfer } from './model'

let logger = createLogger('sqd:indexer')

const dataSource = new DataSourceBuilder()
    .setGateway('https://v2.archive.subsquid.io/network/starknet-mainnet')
    .setRpc(process.env.STARKNET_NODE == null ? undefined : {
        client: new StarknetRpcClient({url: process.env.STARKNET_NODE})
    })
    .setBlockRange({from: 600_000, to: 610_000})
    .setFields({
        block: {
            timestamp: true
        },
        transaction: {
            transactionHash: true
        },
        event: {
            data: true
        }
    })
    .addEvent({
        fromAddress: ['0x68f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8'],
        key0: ['0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9'], // Transfer
        transaction: true
    })
    .build()

const database = new TypeormDatabase()

run(dataSource, database, async ctx => {
    let blocks = ctx.blocks.map(augmentBlock)
    const transfers: Transfer[] = []
    for (let block of blocks) {
        for (let event of block.events) {
            if (event.data.length < 3) throw new Error("Insufficient event data")
            logger.info('Processing transfer')
            let {from, to, amount} = {from: event.data[0], to: event.data[1], amount: BigInt(event.data[2])}
            transfers.push(new Transfer({
                id: event.id,
                blockNumber: block.header.height,
                timestamp: new Date(block.header.timestamp),
                tx: event.getTransaction().transactionHash,
                from,
                to,
                amount
            }))
        }
    }
    await ctx.store.insert(transfers)
})