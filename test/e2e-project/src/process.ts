import * as ss58 from "@subsquid/ss58"
import {decodeHex, SubstrateProcessor, toHex} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import {assertNotNull} from "@subsquid/util-internal"
import assert from "assert"
import {loadInitialData} from "./initialData"
import {Account, BlockHook, BlockTimestamp, HookType, MiddleClass, Miserable, Transaction, Transfer} from "./model"
import {TimestampSetCall} from "./types/calls"
import {BalancesTransferEvent} from "./types/events"
import {SystemAccountStorage} from "./types/storage"
import {getDataSource, getOrCreate, waitForGateway} from "./util"


const processor = new SubstrateProcessor(new TypeormDatabase('test'))
processor.setTypesBundle('typesBundle.json')
processor.setDataSource(getDataSource())


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


processor.addEventHandler('Balances.Transfer', async ctx => {
    assert(ctx.event.call?.origin != null, 'origin must be defined')

    let [from, to, value] = new BalancesTransferEvent(ctx).asV1

    let transfer = new Transfer({
        id: ctx.event.id,
        from,
        to,
        value,
        tip: 0n,
        extrinsicId: ctx.event.extrinsic?.id,
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
    let aliceAccounts = await accounts.getManyAsV1([aliceAddress, aliceAddress])
    assert(aliceAccounts.length === 2)
    assert(aliceAccounts[0] != null)
    assert(aliceAccounts[0].data.free > 0)
    assert(aliceAccounts[0].data.free === aliceAccounts[1]?.data.free)
})


processor.addCallHandler('Timestamp.set', async ctx => {
    let timestamp = new TimestampSetCall(ctx).asV1.now
    if (ctx.block.timestamp !== Number(timestamp)) {
        throw new Error(`Block timestamp ${ctx.block.timestamp} does not match Timestamp.set call argument ${timestamp}`)
    }
    await ctx.store.save(new BlockTimestamp({
        id: ctx.block.hash,
        blockNumber: ctx.block.height,
        timestamp: BigInt(timestamp)
    }))
})


processor.addPostHook({
    data: {
        items: {
            events: {
                'System.ExtrinsicSuccess': {
                    event: {extrinsic: {signature: true, call: {name: true}}}
                }
            }
        }
    }
} as const, async ctx => {
    for (let item of ctx.items) {
        if (item.kind != 'event' || item.event.name != 'System.ExtrinsicSuccess') continue
        let extrinsic = assertNotNull(item.event.extrinsic)
        if (extrinsic.signature == null) continue
        ctx.store.insert(new Transaction({
            id: extrinsic.id,
            name: extrinsic.call.name,
            sender: ss58.codec(42).encode(decodeHex(extrinsic.signature.address))
        }))
    }
})


waitForGateway().then(() => {
    processor.run()
}, err => {
    console.error(err)
    process.exit(1)
})
