import {EvmBatchProcessor} from '@subsquid/evm-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'.toLowerCase()


const processor = new EvmBatchProcessor()
    .setPortal({
        url: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
        bufferThreshold: 10 * 1024 * 1024,
        newBlockTimeout: 5000,
    })
    .setRpcEndpoint('https://rpc.ankr.com/eth')
    .setFinalityConfirmation(500)
    .setBlockRange({from: 0})
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

    ctx.log.info(`found ${transfers.length} transfers`)
    await ctx.store.insert(transfers)
})
