import * as ss58 from "@subsquid/ss58"
import {
    DataHandlerContext,
    SubstrateBatchProcessor,
    SubstrateBatchProcessorFields
} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import * as erc20 from "./erc20"
import {Owner, Transfer} from "./model"


const CONTRACT_ADDRESS = '0x6bf32873add0e3cbaa0d06010a7aeccd3e5d8db81c2f06a351428974995e7504'


const processor = new SubstrateBatchProcessor()
    .setRpcEndpoint('https://rpc.shibuya.astar.network')
    .setBlockRange({from: 6363940})
    .setFields({
        block: {
            timestamp: true
        },
        event: {
            topics: true,
            name: true,
            args: true
        }
    })
    .addContractsContractEmitted({contractAddress: [CONTRACT_ADDRESS]})


type Ctx = DataHandlerContext<Store, SubstrateBatchProcessorFields<typeof processor>>


processor.run(new TypeormDatabase(), async ctx => {
    let txs = extractTransferRecords(ctx)

    let ownerIds = new Set<string>()
    txs.forEach(tx => {
        if (tx.from) {
            ownerIds.add(tx.from)
        }
        if (tx.to) {
            ownerIds.add(tx.to)
        }
    })

    let owners = await ctx.store.findBy(Owner, {
        id: In([...ownerIds])
    }).then(owners => {
        return new Map(owners.map(o => [o.id, o]))
    })

    let transfers = txs.map(tx => {
        let transfer = new Transfer({
            id: tx.id,
            amount: tx.amount,
            block: tx.block,
            timestamp: tx.timestamp
        })

        if (tx.from) {
            transfer.from = owners.get(tx.from)
            if (transfer.from == null) {
                transfer.from = new Owner({id: tx.from, balance: 0n})
                owners.set(tx.from, transfer.from)
            }
            transfer.from.balance -= tx.amount
        }

        if (tx.to) {
            transfer.to = owners.get(tx.to)
            if (transfer.to == null) {
                transfer.to = new Owner({id: tx.to, balance: 0n})
                owners.set(tx.to, transfer.to)
            }
            transfer.to.balance += tx.amount
        }

        return transfer
    })

    await ctx.store.save([...owners.values()])
    await ctx.store.insert(transfers)
})


interface TransferRecord {
    id: string
    from?: string
    to?: string
    amount: bigint
    block: number
    timestamp: Date
}


function extractTransferRecords(ctx: Ctx): TransferRecord[] {
    let records: TransferRecord[] = []
    for (let block of ctx.blocks) {
        for (let event of block.events) {
            if (event.name == 'Contracts.ContractEmitted' && event.args.contract == CONTRACT_ADDRESS) {
                let decoded = erc20.decodeEvent(event.args.data, event.topics)
                if (decoded.__kind == 'Transfer') {
                    records.push({
                        id: event.id,
                        from: decoded.from && ss58.codec(5).encode(decoded.from),
                        to: decoded.to && ss58.codec(5).encode(decoded.to),
                        amount: decoded.value,
                        block: block.header.height,
                        timestamp: new Date(block.header.timestamp!)
                    })
                }
            }
        }
    }
    return records
}
