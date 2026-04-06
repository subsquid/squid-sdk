import {run, withContext} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/evm-objects'
import {DataSourceBuilder, type GetDataSourceBlock} from '@subsquid/evm-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Account, Transfer} from './model'
import {useStore, provideStore} from './hooks'


const CONTRACT = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'.toLowerCase()


const dataSource = new DataSourceBuilder()
    .setPortal('https://portal.sqd.dev/datasets/arbitrum-one')
    .setBlockRange({from: 190000000})
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
    .addLog({
        where: {
            address: [CONTRACT],
            topic0: [erc20.events.Transfer.topic]
        }
    })
    .build()


type Block = GetDataSourceBlock<typeof dataSource>


function extractTransfers(blocks: Block[]): Transfer[] {
    let transfers: Transfer[] = []
    for (let block of blocks) {
        let augmented = augmentBlock(block)
        for (let log of augmented.logs) {
            if (log.address == CONTRACT && erc20.events.Transfer.is(log)) {
                let {from, to, value} = erc20.events.Transfer.decode(log)
                transfers.push(new Transfer({
                    id: log.id,
                    blockNumber: block.header.number,
                    timestamp: new Date(block.header.timestamp),
                    tx: log.transactionHash,
                    from: new Account({id: from}),
                    to: new Account({id: to}),
                    amount: value
                }))
            }
        }
    }
    return transfers
}


run(dataSource, new TypeormDatabase({supportHotBlocks: true}), async ctx => {
    await withContext([provideStore(ctx.store)], async () => {
        let transfers = extractTransfers(ctx.blocks)
        await useStore().insert(transfers)
    })
})
