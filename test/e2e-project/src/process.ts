import {SubstrateProcessor} from "@subsquid/substrate-processor"
import * as process from "process"
import {loadInitialData} from "./initialData"
import {Account, BlockHook, BlockTimestamp, HookType, MiddleClass, Miserable, Transfer} from "./model"
import {decodeHex, getOrCreate} from "./util"


const processor = new SubstrateProcessor('test')


if (process.env.ARCHIVE_ENDPOINT) {
    processor.setDataSource(process.env.ARCHIVE_ENDPOINT)
} else {
    throw new Error('ARCHIVE_ENDPOINT is not set')
}


processor.addPreHook({range: {from: 0, to: 0}}, ctx => loadInitialData(ctx.store))


processor.addPreHook({range: {from: 0, to: 0}}, async ctx => {
    let hook = new BlockHook()
    hook.id = `pre-${ctx.block.height}`
    hook.blockNumber = ctx.block.height
    hook.type = HookType.PRE
    await ctx.store.save(hook)
})


processor.addPostHook({range: {from: 2, to: 3}}, async ctx => {
    let timestamp = await ctx.store.get(BlockTimestamp, {where: {id: ctx.block.hash}})
    if (timestamp == null) {
        throw new Error(`BlockTimestamp should already exist`)
    }
    let hook = new BlockHook()
    hook.id = `post-${ctx.block.height}`
    hook.blockNumber = ctx.block.height
    hook.type = HookType.POST
    hook.timestamp = timestamp
    await ctx.store.save(hook)
})


processor.addEventHandler('balances.Transfer', async ctx => {
    let from = ctx.event.params[0].value as string
    let to = ctx.event.params[1].value as string
    let value = BigInt(ctx.event.params[2].value as string)

    let transfer = new Transfer({
        id: ctx.event.id,
        from: Buffer.from(from, 'ascii'), // random bytes instead of real decoding
        to: Buffer.from(to, 'ascii'),
        value,
        tip: ctx.extrinsic?.tip ?? 0n,
        extrinsicId: ctx.extrinsic?.id,
        insertedAt: new Date(ctx.block.timestamp),
        block: ctx.block.height,
        timestamp: BigInt(ctx.block.timestamp),
        comment: `Transferred ${value} from ${from} to ${to}`
    })

    let fromAcc = await getOrCreate(Account, from, ctx.store)
    fromAcc.balance = fromAcc.balance || 0n
    fromAcc.balance -= value
    fromAcc.balance -= transfer.tip
    fromAcc.status = new Miserable()
    fromAcc.status.hates = 'ALICE'
    fromAcc.status.loves = ['money', 'crypto']
    await ctx.store.save(fromAcc)

    let toAcc = await getOrCreate(Account, to, ctx.store)
    toAcc.balance = toAcc.balance || 0n
    toAcc.balance += value
    toAcc.status = new MiddleClass()
    toAcc.status.father = new Miserable()
    toAcc.status.father.hates = 'BOB'
    toAcc.status.father.loves = []
    await ctx.store.save(toAcc)

    transfer.fromAccount = fromAcc
    transfer.toAccount = toAcc
    await ctx.store.save(transfer)
})


processor.addExtrinsicHandler('timestamp.set', async ctx => {
    let timestamp = Number(ctx.extrinsic.args[0].value as string)
    if (ctx.block.timestamp !== timestamp) {
        throw new Error(`Block timestamp ${ctx.block.timestamp} does not match timestamp.set call argument ${timestamp}`)
    }
    await ctx.store.save(new BlockTimestamp({
        id: ctx.block.hash,
        blockNumber: ctx.block.height,
        timestamp: BigInt(timestamp)
    }))
})


processor.run()
