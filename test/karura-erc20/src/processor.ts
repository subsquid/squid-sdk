import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from "@subsquid/substrate-processor"
import {Store, TypeormDatabase} from "@subsquid/typeorm-store"
import {In} from "typeorm"
import * as erc20 from "./erc20"
import {Owner, Transfer} from "./model"


const CONTRACT_ADDRESS = '0x0000000000000000000100000000000000000080' // KAR


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: 'http://0.0.0.0:8000/graphql',
        chain: 'wss://karura.api.onfinality.io/public-ws'
    })
    .addAcalaEvmExecuted('*', {
        logs: [{
            contract: CONTRACT_ADDRESS,
            filter: [[
                erc20.events['Transfer(address,address,uint256)'].topic
            ]]
        }],
        data: {
            event: {args: true},
        }
    })


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
        let logIndex = 0
        for (let item of block.items) {
            if (item.name == 'EVM.Executed') {
                for (let log of item.event.args.logs) {
                    if (log.address == CONTRACT_ADDRESS) {
                        let transfer = erc20.events['Transfer(address,address,uint256)'].decode(log)
                        records.push({
                            id: item.event.id + '-' + logIndex++,
                            from: transfer.from,
                            to: transfer.to,
                            amount: transfer.value.toBigInt(),
                            block: block.header.height,
                            timestamp: new Date(block.header.timestamp)
                        })
                    }
                }
            }
        }
    }
    return records
}
