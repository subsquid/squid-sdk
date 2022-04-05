import {SubstrateProcessor, toHex} from "@subsquid/substrate-processor"
import {getTransferEvent} from "./events"
import {Account, HistoricalBalance} from "./model"
import {getOrCreate} from "./util"


const processor = new SubstrateProcessor('kusama_balances')


processor.setBatchSize(500)
processor.setDataSource({
    archive: 'https://kusama.indexer.gc.subsquid.io/v4/graphql',
    chain: 'wss://kusama-rpc.polkadot.io'
})


processor.addEventHandler('balances.Transfer', {
    data: {
        event: {
            name: true,
            args: true
        }
    }
} as const, async ctx => {
    let transfer = getTransferEvent(ctx)
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
        timestamp: BigInt(ctx.block.timestamp)
    }))

    await ctx.store.save(new HistoricalBalance({
        id: ctx.event.id + '-from',
        account: toAcc,
        balance: toAcc.balance,
        timestamp: BigInt(ctx.block.timestamp)
    }))
})


processor.run()
