import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/fuel-objects'
import {DataSourceBuilder} from '@subsquid/fuel-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Contract} from './model'


const dataSource = new DataSourceBuilder()
    .setGraphql({
        url: 'https://testnet.fuel.network/v1/graphql',
        strideConcurrency: 2,
        strideSize: 50
    })
    .setGateway('https://v2.archive.subsquid.io/network/fuel-testnet')
    .setFields({
        receipt: {
            contract: true,
            receiptType: true
        },
        transaction: {
            status: true
        }
    })
    .addReceipt({
        type: ['LOG_DATA'],
        transaction: true,
    })
    .build()


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
            }
        }
    }

    ctx.store.upsert([...contracts.values()])
})
