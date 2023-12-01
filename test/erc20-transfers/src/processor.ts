import {EvmBatchProcessor} from '@subsquid/evm-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const CONTRACT = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase()


const processor = new EvmBatchProcessor()
    // .setArchive('https://v2.archive.subsquid.io/network/arbitrum-one')
    .setRpcEndpoint(process.env.ARB_NODE_WS)
    .setFinalityConfirmation(500)
    .setBlockRange({from: 153004199, to: 153004199})
    .setFields({
        log: {transactionHash: true},
        trace: {
            error: true,
            revertReason: true,
            callFrom: true,
            callInput: true,
            callSighash: true,
            callResultOutput: true
        }
    })
    .addLog({
        address: [CONTRACT],
        topic0: [erc20.events.Transfer.topic]
    })
    .addTrace({
        callTo: [CONTRACT]
    })


processor.run(new TypeormDatabase({supportHotBlocks: true}), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        ctx.log.info(block)
        for (let log of block.logs) {
            if (log.address == CONTRACT && log.topics[0] === erc20.events.Transfer.topic) {
                let {from, to, value} = erc20.events.Transfer.decode(log)
                transfers.push(new Transfer({
                    id: log.id,
                    blockNumber: block.header.height,
                    timestamp: new Date(block.header.timestamp * 1000),
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
