import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/evm-objects'
import {DataSourceBuilder} from '@subsquid/evm-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase()


// Create a data source that defines where to get the data and what data to fetch
const dataSource = new DataSourceBuilder()
    // Provide Subsquid Network Portal URL
    .setPortal('https://portal.sqd.dev/datasets/arbitrum-one')
    // Set block range
    .setBlockRange({from: 190000000})
    // Configure fields to fetch
    .setFields({
        block: {
            timestamp: true,
            size: true
        },
        log: {
            transactionHash: true,
            address: true,
            topics: true,
            data: true
        }
    })
    // Add log request with filter
    .addLog({
        where: {
            address: [CONTRACT],
            topic0: [erc20.events.Transfer.topic]
        }
    })
    .build()


// Run the processor
run(dataSource, new TypeormDatabase({supportHotBlocks: true}), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        // Augment block to get rich object model with relationships
        let augmented = augmentBlock(block)
        
        for (let log of augmented.logs) {
            if (log.address == CONTRACT && erc20.events.Transfer.is(log)) {
                let {from, to, value} = erc20.events.Transfer.decode(log)
                transfers.push(new Transfer({
                    id: log.id,
                    blockNumber: augmented.header.number,
                    timestamp: new Date(augmented.header.timestamp),
                    tx: log.transactionHash!,
                    from,
                    to,
                    amount: value
                }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
