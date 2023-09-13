import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {Bytes} from '@subsquid/substrate-runtime'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import {BalancesTransferEventV1020, BalancesTransferEventV1050, BalancesTransferEventV9130} from './types/events'


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
    .setBlockRange({from: 19_666_100})


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            if (event.name == 'Balances.Transfer') {
                let rec: {from: Bytes, to: Bytes, amount: bigint}
                if (BalancesTransferEventV1020.is(event)) {
                    let [from, to, amount, fee] = BalancesTransferEventV1020.decode(event)
                    rec = {from, to, amount}
                } else if (BalancesTransferEventV1050.is(event)) {
                    let [from, to, amount] = BalancesTransferEventV1050.decode(event)
                    rec = {from, to, amount}
                } else {
                    rec = BalancesTransferEventV9130.decode(event)
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
