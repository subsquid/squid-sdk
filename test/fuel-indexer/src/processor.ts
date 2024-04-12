import {FuelBatchProcessor} from '@subsquid/fuel-processor'
import { Store } from '@subsquid/typeorm-store'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import {Contract} from './model'


const processor = new FuelBatchProcessor()
    .setGraphqlEndpoint('https://beta-5.fuel.network/graphql')
    .setGraphqlDataIngestionSettings({
        strideConcurrency: 1,
        strideSize: 5,
    })
    .includeAllBlocks()
    .setBlockRange({
        from: 0,
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
    })


processor.run(new TypeormDatabase(), async ctx => {
    let contracts: Map<String, Contract> = new Map()
    for (let block of ctx.blocks) {
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
