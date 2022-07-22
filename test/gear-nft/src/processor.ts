import {SubstrateProcessor} from '@subsquid/substrate-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {Account, TokenMint} from './model'
import {decodeNFTInput} from './program'


const NFT_PROGRAM_ID = '0x0a19fc36694e4e075d1183ea92b90c79be8a23982004c76b955f5c36323770af'


const processor = new SubstrateProcessor(new TypeormDatabase())


processor.setDataSource({
    archive: 'https://gear-testnet.archive.subsquid.io/graphql',
})


processor.addGearMessageEnqueuedHandler(NFT_PROGRAM_ID, async ctx => {
    if (ctx.event.call?.name != 'Gear.send_message') return

    let input = await decodeNFTInput(ctx.event.call?.args.payload)
    if ('mint' in input) {
        let account = await ctx.store.get(Account, ctx.event.args.source)
        if (account == null) {
            account = new Account({id: ctx.event.args.source})
            ctx.store.save(account)
        }

        let mint = new TokenMint({
            id: ctx.event.args.id,  // message_id
            name: input.mint.tokenMetadata.name,
            description: input.mint.tokenMetadata.description,
            media: input.mint.tokenMetadata.media,
            reference: input.mint.tokenMetadata.reference,
            account,
        })
        ctx.store.save(mint)
    }
})


processor.addGearUserMessageSentHandler(NFT_PROGRAM_ID, async ctx => {
    let replyId = ctx.event.args.message.reply[0]
    let mint = await ctx.store.get(TokenMint, replyId)
    if (mint != null) {
        mint.successful = ctx.event.args.message.reply[1] == 0
        ctx.store.save(mint)
    }
})


processor.run()
