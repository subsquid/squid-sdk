import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/fuel-objects'
import {DataSourceBuilder} from '@subsquid/fuel-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Contract} from './model'


const dataSource = new DataSourceBuilder()
    .setGraphql({
        url: 'https://beta-5.fuel.network/graphql',
        strideConcurrency: 1,
        strideSize: 5
    })
    .setFields({
        block: {
            prevRoot: true
        },
        receipt: {
            contract: true,
            receiptType: true
        }
    })
    .addReceipt({
        type: ['LOG_DATA'],
    }).build()


const database = new TypeormDatabase()


run(dataSource, database, async ctx => {
    let contracts: Map<String, Contract> = new Map()

    let blocks = ctx.blocks.map(augmentBlock)

    for (let block of blocks) {
        for (let receipt of block.receipts) {
            if (receipt.receiptType == 'LOG_DATA' && receipt.contract != null) {
                let contract = contracts.get(receipt.contract)
                if (!contract) {
                    contract = await ctx.store.findOne(Contract, {where: {id: receipt.contract}})
                    if (!contract) {
                        contract = new Contract({
                            id: receipt.contract,
                            logsCount: 0,
                            foundAt: block.header.height
                        })
                    }
                }
                contract.logsCount += 1
                contracts.set(contract.id, contract)
                if (contract.logsCount > 20) {
                    console.log(`contract ${contract.id} has more than 20 data logs`);
                }
            }
        }
    }

    ctx.store.upsert([...contracts.values()])
})
