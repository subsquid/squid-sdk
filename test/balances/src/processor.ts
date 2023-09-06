import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {Bytes} from '@subsquid/substrate-runtime'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import * as v1020 from './types/v1020'
import * as v1050 from './types/v1050'
import * as v9130 from './types/v9130'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: 'https://kusama-rpc.polkadot.io',
        archive: 'https://v2.archive.subsquid.io/network/kusama'
    })
    .addEvent({
        name: ['Balances.Transfer']
    })
    .setFields({
        block: {
            timestamp: true
        }
    })


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            if (event.name == 'Balances.Transfer') {
                let rec: {from: Bytes, to: Bytes, amount: bigint}
                if (v1020.events.Balances.Transfer.is(event)) {
                    let [from, to, amount] = v1020.events.Balances.Transfer.decode(event)
                    rec = {from, to, amount}
                } else if (v1050.events.Balances.Transfer.is(event)) {
                    let [from, to, amount] = v1050.events.Balances.Transfer.decode(event)
                    rec = {from, to, amount}
                } else {
                    rec = v9130.events.Balances.Transfer.decode(event)
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
