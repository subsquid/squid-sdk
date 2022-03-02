import {assertNotNull, SubstrateEvmProcessor} from "@subsquid/substrate-evm-processor"
import {contract, createContractEntity, getContractEntity} from "./contract"
import * as erc721 from "./erc721"
import {Owner, Token, Transfer} from "./model"


const processor = new SubstrateEvmProcessor('erc721')


processor.setDataSource({
    chain: assertNotNull(process.env.CHAIN_NODE),
    archive: assertNotNull(process.env.ARCHIVE)
})


processor.addPreHook({range: {from: 0, to: 0}}, async ctx => {
    await ctx.store.save(createContractEntity())
})


processor.addEvmLogHandler(
    contract.address,
    {
        filter: [
            erc721.events['Transfer(address,address,uint256)'].topic
        ]
    },
    async ctx => {
        let transfer = erc721.events['Transfer(address,address,uint256)'].decode(ctx)

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
            id: ctx.txHash,
            token,
            from,
            to,
            timestamp: BigInt(ctx.substrate.block.timestamp),
            block: ctx.substrate.block.height,
            transactionHash: ctx.txHash
        }))
    }
)


processor.run()
