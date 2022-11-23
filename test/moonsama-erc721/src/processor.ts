import {getEvmLog} from "@subsquid/substrate-frontier-evm"
import {SubstrateProcessor} from "@subsquid/substrate-processor"
import {TypeormDatabase} from "@subsquid/typeorm-store"
import {contractAddress, createContractEntity, getContractEntity} from "./contract"
import * as erc721 from "./abi/erc721"
import {Owner, Token, Transfer} from "./model"


const processor = new SubstrateProcessor(new TypeormDatabase())


processor.setDataSource({
    archive: 'https://moonriver.archive.subsquid.io/graphql',
    chain: 'wss://moonriver-rpc.dwellir.com'
})


processor.addPreHook({range: {from: 0, to: 0}}, async ctx => {
    await ctx.store.save(createContractEntity())
})


processor.addEvmLogHandler(
    contractAddress,
    {
        filter: [
            erc721.events.Transfer.topic
        ],
    },
    async ctx => {
        let evmLog = getEvmLog(ctx, ctx.event)
        let transfer = erc721.events.Transfer.decode(evmLog)

        let from = await ctx.store.get(Owner, transfer.from)
        if (from == null) {
            from = new Owner({id: transfer.from, balance: 0n})
            await ctx.store.save(from)
        }

        let to = await ctx.store.get(Owner, transfer.to)
        if (to == null) {
            to = new Owner({id: transfer.to, balance: 0n})
            ctx.store.save(to)
        }

        let token = await ctx.store.get(Token, transfer.tokenId.toString())
        if (token == null) {
            let contract = new erc721.Contract(ctx, contractAddress)
            token = new Token({
                id: transfer.tokenId.toString(),
                uri: await contract.tokenURI(transfer.tokenId),
                contract: await getContractEntity(ctx),
                owner: to
            })
            await ctx.store.save(token)
        } else {
            token.owner = to
            await ctx.store.save(token)
        }

        await ctx.store.save(new Transfer({
            id: ctx.event.evmTxHash,
            token,
            from,
            to,
            timestamp: BigInt(ctx.block.timestamp),
            block: ctx.block.height,
            transactionHash: ctx.event.evmTxHash
        }))
    }
)


processor.run()
