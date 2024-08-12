import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/starknet-objects'
import {DataSourceBuilder} from '@subsquid/starknet-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {createLogger} from '@subsquid/logger'

let logger = createLogger('sqd:indexer')

const dataSource = new DataSourceBuilder()
    .setGateway('https://v2.archive.subsquid.io/network/starknet-mainnet')
    .setBlockRange({from: 500_000, to: 501_000})
    .setFields({
        transaction: {
            transactionHash: true,
            contractAddress: true,
            type: true,
            senderAddress: true
        }
    })
    .addTransaction({
        contractAddress: ['0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8'],
        type: ['INVOKE']
    })
    .build()

const database = new TypeormDatabase()

run(dataSource, database, async ctx => {
    let blocks = ctx.blocks.map(augmentBlock)

    for (let block of blocks) {
        logger.info(`Block ${block.header.height} contains ${block.transactions.length} transactions`)
    }
})