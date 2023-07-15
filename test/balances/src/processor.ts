import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import {BalancesTransferEvent} from './types/events'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: 'https://kusama-rpc.polkadot.io'
    })
    .addEvent({
        name: ['Balances.Transfer']
    })
    .setFields({
        block: {timestamp: true}
    })
    .setBlockRange({from: 18_774_000})


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            if (event.name == 'Balances.Transfer') {
                let e = new BalancesTransferEvent(ctx, event)
                let rec: {from: Uint8Array, to: Uint8Array, amount: bigint}
                if (e.isV1020) {
                    let [from, to, amount, fee] = e.asV1020
                    rec = {from, to, amount}
                } else if (e.isV1050) {
                    let [from, to, amount] = e.asV1020
                    rec = {from, to, amount}
                } else {
                    rec = e.asV9130
                }
                transfers.push(new Transfer({
                    id: event.id,
                    from: ss58.codec('kusama').encode(rec.from),
                    to: ss58.codec('kusama').encode(rec.to),
                    amount: BigDecimal(rec.amount, 12),
                    timestamp: BigInt(block.header.timestamp ?? 0),
                }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
