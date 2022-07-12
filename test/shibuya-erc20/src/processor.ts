import * as ss58 from "@subsquid/ss58"
import {assertNotNull, SubstrateProcessor} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import {Transfer, Owner} from "./model"
import {ContractEvent} from "./erc20"


const processor = new SubstrateProcessor(new TypeormDatabase({stateSchema: "shibuya_erc20"}))


processor.setDataSource({
    chain: "wss://rpc.shibuya.astar.network",
    archive: "https://shibuya.archive.subsquid.io/graphql",
})


processor.addContractsContractEmittedHandler(
    "0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72",
    async ctx => {
        let event = new ContractEvent(ctx.event)
        if (!event.isTransferEvent) return
        let transfer = event.getTransferEvent()

        let from
        if (transfer.from) {
            let encoded_from = ss58.codec('astar').encode(transfer.from)
            from = assertNotNull(await ctx.store.get(Owner, encoded_from))
            from.balance -= transfer.value
            ctx.store.save(from)
        }

        let to
        if (transfer.to) {
            let encoded_to = ss58.codec('astar').encode(transfer.to)
            to = await ctx.store.get(Owner, encoded_to)
            if (to == null) {
                to = new Owner({
                    id: encoded_to,
                    balance: transfer.value
                })
            } else {
                to.balance += transfer.value
            }
            ctx.store.save(to)
        }

        await ctx.store.save(new Transfer({
            id: ctx.event.id,
            from,
            to,
            value: transfer.value,
            timestamp: BigInt(ctx.block.timestamp),
            block: ctx.block.height,
        }))
    }
)


processor.run()
