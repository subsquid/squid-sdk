import {SubstrateProcessor, toHex} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import {getTransferEvent} from "./events"
import {Account, HistoricalBalance} from "./model"
import {getOrCreate} from "./util"


const processor = new SubstrateProcessor(new TypeormDatabase('kusama_balances'))


processor.setBatchSize(500)
processor.setDataSource({
    archive: 'https://kusama.archive.subsquid.io/graphql'
})

processor.setBlockRange({from: 0, to: 10_000_000})

processor.addEventHandler('Balances.Transfer', {
    data: {
        event: {
            name: true,
            args: true
        }
    }
} as const, async ctx => {
    let transfer = getTransferEvent(ctx)
    let timestamp = BigInt(new Date(ctx.block.timestamp).valueOf())
    let tip = 0n

    let fromAcc = await getOrCreate(ctx.store, Account, toHex(transfer.from))
    fromAcc.wallet = fromAcc.id
    fromAcc.balance = fromAcc.balance || 0n
    fromAcc.balance -= transfer.amount
    fromAcc.balance -= tip
    await ctx.store.save(fromAcc)

    const toAcc = await getOrCreate(ctx.store, Account, toHex(transfer.to))
    toAcc.wallet = toAcc.id
    toAcc.balance = toAcc.balance || 0n
    toAcc.balance += transfer.amount
    await ctx.store.save(toAcc)

    await ctx.store.save(new HistoricalBalance({
        id: ctx.event.id + '-to',
        account: fromAcc,
        balance: fromAcc.balance,
        timestamp
    }))

    await ctx.store.save(new HistoricalBalance({
        id: ctx.event.id + '-from',
        account: toAcc,
        balance: toAcc.balance,
        timestamp
    }))
})


processor.run()
