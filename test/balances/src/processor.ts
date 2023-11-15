import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {Bytes} from '@subsquid/substrate-runtime'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import {events} from './types'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: process.env.KUSAMA_NODE_WS || 'https://kusama-rpc.polkadot.io',
        archive: 'https://v2.archive.subsquid.io/network/kusama'
    })
    .addEvent({
        name: [events.balances.transfer.name]
    })
    .setFields({
        block: {
            timestamp: true
        }
    })
    .setBlockRange({from: 19_666_100})


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            let rec: {from: Bytes, to: Bytes, amount: bigint}
            if (events.balances.transfer.v1020.is(event)) {
                let [from, to, amount, fee] = events.balances.transfer.v1020.decode(event)
                rec = {from, to, amount}
            } else if (events.balances.transfer.v1050.is(event)) {
                let [from, to, amount] = events.balances.transfer.v1050.decode(event)
                rec = {from, to, amount}
            } else {
                rec = events.balances.transfer.v9130.decode(event)
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

    await ctx.store.insert(transfers)
})
