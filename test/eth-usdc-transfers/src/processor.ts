import { EvmBatchProcessor } from '@subsquid/evm-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: 'https://eth.archive.subsquid.io',
    })
    .addLog({
        range: {from: 6_082_465},
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        filter: [[erc20.events.Transfer.topic]],
    })


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.kind == 'log' && item.log.topics[0] == erc20.events.Transfer.topic) {
                let {from, to, value} = erc20.events.Transfer.decode(item.log)
                transfers.push(new Transfer({
                    id: item.log.id,
                    blockNumber: block.header.height,
                    timestamp: new Date(block.header.timestamp),
                    txHash: item.log.transactionHash,
                    from,
                    to,
                    amount: value.toBigInt()
                }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
