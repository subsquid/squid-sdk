import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import {BalancesTransferEvent} from './types/events'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: 'https://kusama.archive.subsquid.io/graphql'
    })
    .addEvent('Balances.Transfer', {
        data: {event: {args: true}}
    } as const)


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.name == "Balances.Transfer") {
                let e = new BalancesTransferEvent(ctx, item.event)
                let rec: {from: Uint8Array, to: Uint8Array, amount: bigint}
                if (e.isV1020) {
                    let [from, to, amount, fee] = e.asV1020
                    rec = {from, to, amount}
                } else if (e.isV1050) {
                    let [from, to, amount] = e.asV1050
                    rec = {from, to, amount}
                } else {
                    rec = e.asV9130
                }

                let tags: string[] = []
                tags.push(['a', 'b', 'c', 'd'][block.header.height % 4])
                tags.push(['e', 'f', 'g'][item.event.pos % 3])

                transfers.push(new Transfer({
                    id: item.event.id,
                    from: ss58.codec('kusama').encode(rec.from),
                    to: ss58.codec('kusama').encode(rec.to),
                    amount: BigDecimal(rec.amount, 12),
                    timestamp: BigInt(block.header.timestamp),
                    tags
                }))
            }
        }
    }

    await ctx.store.insert(transfers)
})
