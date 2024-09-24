import {run} from '@subsquid/batch-processor'
import {DataSourceBuilder, assertNotNull} from '@subsquid/tron-stream'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import {Transfer} from './model'


const dataSource = new DataSourceBuilder()
    .setHttpApi({
        url: assertNotNull(process.env.TRON_HTTP_API)
    })
    .includeAllBlocks()
    .build()


const database = new TypeormDatabase()


run(dataSource, database, async ctx => {
    for (let block of ctx.blocks) {
        console.log(block)
    }
})
