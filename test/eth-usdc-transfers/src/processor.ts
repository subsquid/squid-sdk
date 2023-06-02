import {EvmBatchProcessor} from '@subsquid/evm-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'


const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: 'https://v2.archive.subsquid.io/network/ethereum-mainnet',
        chain: process.env.CHAIN_RPC
    })
    .addLog({
        address: [CONTRACT],
        topic0: [erc20.events.Transfer.topic]
    })
    .setFields({
        log: {transactionHash: true}
    })
    .setFinalityConfirmation(50)
    .setBlockRange({from: 17_200_000})


processor.run(new TypeormDatabase({supportHotBlocks: true}), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address == CONTRACT && log.topics[0] === erc20.events.Transfer.topic) {
                let {from, to, value} = erc20.events.Transfer.decode(log)
                transfers.push(new Transfer({
                    id: log.id,
                    blockNumber: block.header.height,
                    timestamp: new Date(block.header.timestamp),
                    tx: log.transactionHash,
                    from,
                    to,
                    amount: value
                }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
