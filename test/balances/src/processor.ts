import {BigDecimal} from '@subsquid/big-decimal'
import * as ss58 from '@subsquid/ss58'
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {Bytes} from '@subsquid/substrate-runtime'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Transfer} from './model'
import {events} from './types'


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
        name: [events.balances.transfer.name]
    })


processor.run(new TypeormDatabase(), async ctx => {
    let transfers: Transfer[] = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            let rec: {from: Bytes, to: Bytes, amount: bigint}

            let transferType = events.balances.transfer.at(block.header)

            switch (transferType.__version) {
                case 'v1020':
                case 'v1050': {
                    let [from, to, amount] = transferType.decode(event)
                    rec = {from, to, amount}
                    break
                }
                case 'v9130': {
                    rec = transferType.decode(event)
                    break
                }
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
