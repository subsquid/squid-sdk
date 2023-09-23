import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {Bytes} from '@subsquid/substrate-runtime'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import balances from './runtime/balances'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: 'https://kusama-rpc.polkadot.io',
        archive: 'https://v2.archive.subsquid.io/network/kusama'
    })
    .addEvent({
        name: [balances.events.Transfer.name]
    })  
    .setFields({
        block: {
            timestamp: true
        }
    })
    .setBlockRange({from: 0})


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            if (event.name == balances.events.Transfer.name) {
                let rec: {from: Bytes, to: Bytes, amount: bigint}
                if (balances.events.Transfer.v1020.is(event)) {
                    let [from, to, amount] = balances.events.Transfer.v1020.decode(event)
                    rec = {from, to, amount}
                } else if (balances.events.Transfer.v1050.is(event)) {
                    let [from, to, amount] = balances.events.Transfer.v1050.decode(event)
                    rec = {from, to, amount}
                } else {
                    rec = balances.events.Transfer.v9130.decode(event)
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
