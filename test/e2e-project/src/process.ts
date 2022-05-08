import * as ss58 from "@subsquid/ss58"
import {SubstrateProcessor, toHex} from "@subsquid/substrate-processor"
import assert from "assert"
import * as process from "process"
import {loadInitialData} from "./initialData"
import {Account, BlockHook, BlockTimestamp, HookType, MiddleClass, Miserable, Transfer} from "./model"
import {TimestampSetCall} from "./types/calls"
import {BalancesTransferEvent} from "./types/events"
import {SystemAccountStorage} from "./types/storage"
import {getOrCreate} from "./util"


const processor = new SubstrateProcessor('test')


processor.setTypesBundle('typesBundle.json')


if (process.env.ARCHIVE_ENDPOINT && process.env.CHAIN_ENDPOINT) {
    processor.setDataSource({
        archive: process.env.ARCHIVE_ENDPOINT,
        chain: process.env.CHAIN_ENDPOINT
    })
} else {
    throw new Error('ARCHIVE_ENDPOINT and CHAIN_ENDPOINT must be set')
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
    let [from, to, value] = new BalancesTransferEvent(ctx).asV1

    let blockEvent = ctx.block.events.find(e => e.name === 'balances.Transfer')
    assert(blockEvent != null, 'should find event among block events')
    assert.strictEqual(blockEvent.extrinsic, 'balances.transfer')
    assert.strictEqual(blockEvent.extrinsicId, ctx.extrinsic!.id)
    assert(ctx.block.timestamp != null, 'block.timestamp must be set')
    assert(ctx.block.timestamp === ctx.event.blockTimestamp, 'event.blockTimestamp must be set to block.timestamp')

    let transfer = new Transfer({
        id: ctx.event.id,
        from,
        to,
        value,
        tip: ctx.extrinsic?.tip ?? 0n,
        extrinsicId: ctx.extrinsic?.id,
        insertedAt: new Date(ctx.block.timestamp),
        block: ctx.block.height,
        timestamp: BigInt(ctx.block.timestamp),
        comment: `Transferred ${value} from ${from} to ${to}`
    })

    let fromAcc = await getOrCreate(Account, toHex(from), ctx.store)
    fromAcc.balance = fromAcc.balance || 0n
    fromAcc.balance -= value
    fromAcc.balance -= transfer.tip
    fromAcc.status = new Miserable()
    fromAcc.status.hates = 'ALICE'
    fromAcc.status.loves = ['money', 'crypto']
    await ctx.store.save(fromAcc)

    let toAcc = await getOrCreate(Account, toHex(to), ctx.store)
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


processor.addPreHook({range: {from: 0, to: 0}}, async ctx => {
    let accounts = new SystemAccountStorage(ctx)
    let aliceAddress = ss58.decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY').bytes
    let aliceAccount = await accounts.getAsV1(aliceAddress)
    assert(aliceAccount.data.free > 0)
    let aliceAccounts = await accounts.queryAsV1([aliceAddress, aliceAddress])
    assert(aliceAccounts[0].data.free > 0 && aliceAccounts[1].data.free > 0)
})


processor.addExtrinsicHandler('timestamp.set', async ctx => {
    let timestamp = new TimestampSetCall(ctx).asV1.now
    if (ctx.block.timestamp !== Number(timestamp)) {
        throw new Error(`Block timestamp ${ctx.block.timestamp} does not match timestamp.set call argument ${timestamp}`)
    }
    await ctx.store.save(new BlockTimestamp({
        id: ctx.block.hash,
        blockNumber: ctx.block.height,
        timestamp: BigInt(timestamp)
    }))
})


processor.run()
