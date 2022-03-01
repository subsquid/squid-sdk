import {EventHandlerContext, Store, SubstrateProcessor} from "@subsquid/substrate-processor"
import {Account, HistoricalBalance} from "./model"
import {BalancesTransferEvent} from "./types/events"


const processor = new SubstrateProcessor('kusama_balances')


processor.setBatchSize(500)
processor.setDataSource({
    archive: 'https://kusama.indexer.gc.subsquid.io/v4/graphql',
    chain: 'wss://kusama-rpc.polkadot.io'
})


processor.addEventHandler('balances.Transfer', async ctx => {
    let transfer = getTransferEvent(ctx)
    let tip = ctx.extrinsic?.tip || 0n

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


interface TransferEvent {
    from: Uint8Array
    to: Uint8Array
    amount: bigint
}


function getTransferEvent(ctx: EventHandlerContext): TransferEvent {
    let event = new BalancesTransferEvent(ctx)
    if (event.isV1020) {
        let [from, to, amount] = event.asV1020
        return {from, to, amount}
    } else if (event.isV1050) {
        let [from, to, amount] = event.asV1050
        return {from, to, amount}
    } else {
        return event.asLatest
    }
}


function toHex(data: Uint8Array): string {
    return '0x' + Buffer.from(data).toString('hex')
}


async function getOrCreate<T extends {id: string}>(
    store: Store,
    entityConstructor: EntityConstructor<T>,
    id: string
): Promise<T> {

    let e = await store.get<T>(entityConstructor, {
        where: { id },
    })

    if (e == null) {
        e = new entityConstructor()
        e.id = id
    }

    return e
}


type EntityConstructor<T> = {
    new (...args: any[]): T
}
