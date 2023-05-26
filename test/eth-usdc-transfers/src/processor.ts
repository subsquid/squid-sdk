import {EvmBatchProcessor} from '@subsquid/evm-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import * as layout from './abi/layout'
import {Transfer} from './model'


const CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'


const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: 'https://v2.archive.subsquid.io/network/ethereum-mainnet',
        chain: 'https://rpc.ankr.com/eth'
    })
    .addLog({
        address: [CONTRACT],
        topic0: [erc20.events.Transfer.topic],
    })
    .addStateDiff({
        address: [CONTRACT],
    })
    .setFields({
        log: {transactionHash: true}
    })
    .setBlockRange({from: 16_000_000})

    console.log(layout.storage.totalSupply_.encodeKey())


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
        
        let c = new erc20.Contract(ctx, block.header, CONTRACT)
        console.log(await c.eth_getStorage(layout.storage.totalSupply_, []))
    }

    await ctx.store.insert(transfers)
})
