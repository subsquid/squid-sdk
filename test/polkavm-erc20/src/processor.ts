import {SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import * as erc20 from "./abi/erc20"
import {Transfer} from "./model"


const CONTRACT_ADDRESS = "0x62cd4e0c5b0d4587861a21710ed15ba1823a6341"


const processor = new SubstrateBatchProcessor()
    .setRpcEndpoint("wss://westend-asset-hub-rpc.polkadot.io")
    .setBlockRange({from: 10417030})
    .setFields({
        block: {
            timestamp: true
        },
        event: {
            name: true,
            args: true
        }
    })
    .addReviveContractEmitted({
        contract: [CONTRACT_ADDRESS],
        topic0: [erc20.events.Transfer.topic]
    })


processor.run(new TypeormDatabase(), async ctx => {
    let transfers = []

    for (let block of ctx.blocks) {
        for (let event of block.events) {
            if (event.name == "Revive.ContractEmitted" && event.args.contract == CONTRACT_ADDRESS) {
                let decoded = erc20.events.Transfer.decode(event.args)
                let transfer = new Transfer({
                    id: event.id,
                    amount: decoded.value,
                    from: decoded.from,
                    to: decoded.to,
                    block: block.header.height,
                    timestamp: new Date(block.header.timestamp!)
                })
                transfers.push(transfer)
            }
        }
    }

    await ctx.store.insert(transfers)
})
