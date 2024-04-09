import * as ss58 from '@subsquid/ss58'
import {
    assertNotNull,
    DataHandlerContext,
    decodeHex,
    SubstrateBatchProcessor,
    SubstrateBatchProcessorFields
} from '@subsquid/substrate-processor'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import {In} from 'typeorm'
import {Owner, Token, Transfer} from './model'
import * as psp22 from './psp22'
import {ContractsContractEmittedV31} from './types/events'


const CONTRACT_ADDRESS = '0x10f48492ccc953b2948bc2bd027d854a73d08ad3744663bc433fd8ea9d845c8e'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        chain: "https://rpc.shibuya.astar.network"
    })
    .setBlockRange({
        from: 3176542
    })
    .setFields({
        block: {
            timestamp: true
        }
    })
    .addContractsContractEmitted({
        contractAddress: [CONTRACT_ADDRESS]
    })


type Ctx = DataHandlerContext<Store, SubstrateBatchProcessorFields<typeof processor>>


let token: Token | undefined


export async function getOrCreateToken(ctx: Ctx): Promise<Token> {
    if (token == null) {
        token = await ctx.store.get(Token, CONTRACT_ADDRESS)
        if (token == null) {
            let contract = new psp22.Contract(ctx, CONTRACT_ADDRESS)
            let tokenName = await contract.PSP22Metadata_token_name()
            let tokenSymbol = await contract.PSP22Metadata_token_symbol()
            let tokenDecimals = await contract.PSP22Metadata_token_decimals()
            let decoder = new TextDecoder("utf-8", {
                fatal: true,
                ignoreBOM: false
            })
            token = new Token({
                id: CONTRACT_ADDRESS,
                name: decoder.decode(decodeHex(assertNotNull(tokenName))),
                symbol: decoder.decode(decodeHex(assertNotNull(tokenSymbol))),
                decimals: tokenDecimals,
            })
            await ctx.store.insert(token)
        }
    }
    return token
}


processor.run(new TypeormDatabase(), async ctx => {
    let token = await getOrCreateToken(ctx)
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
            token,
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
            if (event.name == 'Contracts.ContractEmitted') {
                let {contract, data} = ContractsContractEmittedV31.decode(event)
                if (contract == CONTRACT_ADDRESS) {
                    let ce = psp22.decodeEvent(data)
                    if (ce.__kind == 'Transfer') {
                        records.push({
                            id: event.id,
                            from: ce.from && ss58.codec(5).encode(decodeHex(ce.from)),
                            to: ce.to && ss58.codec(5).encode(decodeHex(ce.to)),
                            amount: ce.value,
                            block: block.header.height,
                            timestamp: new Date(block.header.timestamp ?? 0)
                        })
                    }
                }
            }
        }
    }
    return records
}
