import * as ss58 from "@subsquid/ss58"
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import * as erc20 from "./erc20"
import {Owner, Transfer} from "./model"


const CONTRACT_ADDRESS = '0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: "https://shibuya.archive.subsquid.io/graphql"
    })
    .addContractsContractEmitted(CONTRACT_ADDRESS, {
        data: {
            event: {args: true}
        }
    } as const)


type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>


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
        for (let item of block.items) {
            if (item.name == 'Contracts.ContractEmitted' && item.event.args.contract == CONTRACT_ADDRESS) {
                let event = erc20.decodeEvent(item.event.args.data)
                if (event.__kind == 'Transfer') {
                    records.push({
                        id: item.event.id,
                        from: event.from && ss58.codec(5).encode(event.from),
                        to: event.to && ss58.codec(5).encode(event.to),
                        amount: event.value,
                        block: block.header.height,
                        timestamp: new Date(block.header.timestamp)
                    })
                }
            }
        }
    }
    return records
}
