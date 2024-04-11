import {FuelBatchProcessor} from '@subsquid/fuel-processor'
import { Store } from '@subsquid/typeorm-store'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'


const processor = new FuelBatchProcessor()
    .setGraphqlEndpoint('https://beta-5.fuel.network/graphql')
    .setGraphqlDataIngestionSettings({
        strideConcurrency: 1,
        strideSize: 5,
    })
    .includeAllBlocks()
    .setBlockRange({
        from: 9280460,
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
        logDataContract: ['0xd2a93abef5c3f45f48bb9f0736ccfda4c3f32c9c57fc307ab9363ef7712f305f']
    })


processor.run(new TypeormDatabase(), async ctx => {
    for (let block of ctx.blocks) {
        for (let receipt of block.receipts) {
            console.log(receipt.receiptType, receipt.contract)
        }
    }
})
