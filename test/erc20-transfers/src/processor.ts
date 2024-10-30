import {EvmBatchProcessor} from '@subsquid/evm-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'.toLowerCase()


const processor = new EvmBatchProcessor()
    .setGateway('http://localhost:8080/datasets/ethereum-mainnet')
    // .setRpcEndpoint(process.env.ARB_NODE_WS)
    .setFinalityConfirmation(500)
    .setBlockRange({from: 20801368})
    .setFields({
        block: {size: true},
        log: {transactionHash: true},
    })
    .addLog({
        address: [CONTRACT],
        topic0: [erc20.events.Transfer.topic]
    })


processor.run(new TypeormDatabase({supportHotBlocks: true}), async ctx => {
    let transfers: Transfer[] = []

    
    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address == CONTRACT &&  erc20.events.Transfer.is(log)) {
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

    // await ctx.store.insert(transfers)
})
