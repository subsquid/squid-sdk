import {SubstrateProcessor} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import {Transfer} from "./model"
import {decodeTransferEvent} from "./erc20"


const processor = new SubstrateProcessor(new TypeormDatabase("shibuya_erc20"))


processor.setDataSource({
    chain: "wss://rpc.shibuya.astar.network",
    archive: "http://0.0.0.0:8000/graphql",
})


processor.addContractsContractEmittedHandler(
    "0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72",
    async ctx => {
        let transfer = decodeTransferEvent(ctx.event)
        ctx.store.save(new Transfer({
            id: ctx.event.id,
            from: transfer.from ? (transfer.from as Buffer).toString('hex') : undefined,
            to: transfer.to ? (transfer.from as Buffer).toString('hex') : undefined,
            value: transfer.value,
            timestamp: ctx.block.timestamp,
            block: ctx.block.height,
        }))
    }
)


processor.run()
