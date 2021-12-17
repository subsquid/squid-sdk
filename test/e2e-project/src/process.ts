import {SubstrateProcessor} from "@subsquid/substrate-processor"
import * as process from "process"
import {loadInitialData} from "./initialData"
import {BlockHook, HookType} from "./model"


const processor = new SubstrateProcessor('test')


if (process.env.ARCHIVE_ENDPOINT) {
    processor.setDataSource(process.env.ARCHIVE_ENDPOINT)
} else {
    throw new Error('ARCHIVE_ENDPOINT is not set')
}


processor.addPreHook({from: 0, to: 0}, ctx => loadInitialData(ctx.store))


processor.addPreHook({from: 0, to: 0}, async ctx => {
    let hook = new BlockHook()
    hook.id = `pre-${ctx.block.height}`
    hook.blockNumber = ctx.block.height
    hook.type = HookType.PRE
    await ctx.store.save(hook)
})


processor.addPostHook({from: 2, to: 3}, async ctx => {
    let hook = new BlockHook()
    hook.id = `post-${ctx.block.height}`
    hook.blockNumber = ctx.block.height
    hook.type = HookType.POST
    await ctx.store.save(hook)
})


processor.run()
