import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import * as balances from './types/balances'


const processor = new SubstrateBatchProcessor()
    .setGateway('https://v2.archive.subsquid.io/network/kusama')
    .setRpcEndpoint(process.env.KUSAMA_NODE_WS || 'wss://kusama-rpc.polkadot.io')
    .setFields({
        block: {
            timestamp: true
        }
    })
    .setBlockRange({from: 19_666_100})
    .addEvent({
        name: [balances.events.transfer.name]
    })


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            let rec = balances.events.transfer.at(block.header, function (e, v) {
                switch (v) {
                    case 'v1020':
                    case 'v1050': {
                        let [from, to, amount] = e.decode(event)
                        return {from, to, amount}
                    }
                    case 'v9130': {
                        return e.decode(event)
                    }
                }
            })

            /**
             * Just a demo
             */
            // let data = await balances.storage.account.at(block.header, async (s, _) => {
            //     let d = s.getDefault()
            //     let [from, to] = await s.getMany([rec.from, rec.to])
            //     return {from: from?.free ?? d.free, to: to?.free ?? d.free}
            // })

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
