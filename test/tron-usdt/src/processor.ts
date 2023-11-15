import {TronBatchProcessor} from '@subsquid/tron-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = 'a614f803b6fd780986a42c78ec9c7f77e6ded13c'
const TOPIC0 = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'


const processor = new TronBatchProcessor()
    .setDataSource({
        archive: 'https://v2.archive.subsquid.io/network/ethereum-mainnet',
        chain: 'https://go.getblock.io/3bc0cee0f143456cab259615d43f8097'
    })
    .addLog({
        address: [CONTRACT],
        topic0: [TOPIC0]
    })
    .setFinalityConfirmation(20)


processor.run(new TypeormDatabase({supportHotBlocks: true}), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address == CONTRACT && log.topics[0] === TOPIC0) {
                console.log(log)
                // let {from, to, value} = erc20.events.Transfer.decode(log)
                // transfers.push(new Transfer({
                //     id: log.id,
                //     blockNumber: block.header.height,
                //     timestamp: new Date(block.header.timestamp),
                //     tx: log.transactionHash,
                //     from,
                //     to,
                //     amount: value
                // }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
