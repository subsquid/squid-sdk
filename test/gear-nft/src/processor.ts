import {SubstrateBatchProcessor, BatchProcessorItem, BatchContext, assertNotNull} from '@subsquid/substrate-processor'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import { In } from 'typeorm'
import {Account, TokenMint} from './model'
import {decodeNFTInput} from './program'


const NFT_PROGRAM_ID = '0x0a19fc36694e4e075d1183ea92b90c79be8a23982004c76b955f5c36323770af'


const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: 'https://gear-testnet.archive.subsquid.io/graphql'
    })
    .addGearMessageEnqueued(NFT_PROGRAM_ID, {
        data: {
            event: {
                args: true,
                phase: true,
                call: {args: true}
            },
        }
    })
    .addGearUserMessageSent(NFT_PROGRAM_ID, {
        data: {
            event: {args: true}
        }
    })


type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>


processor.run(new TypeormDatabase(), async ctx => {
    let {records, replies} = await extractMintsAndReplies(ctx)

    let accountIds = new Set<string>()
    records.forEach(rec => {
        accountIds.add(rec.account)
    })

    let accounts = await ctx.store.findBy(Account, {
        id: In([...accountIds])
    }).then(accounts => {
        return new Map(accounts.map(account => [account.id, account]))
    })

    let mints = new Map(records.map(rec => {
        let account = accounts.get(rec.account)
        if (account == null) {
            account = new Account({id: rec.account})
            accounts.set(rec.account, account)
        }
        let tokenMint = new TokenMint({
            ...rec,
            account,
        })
        return [rec.id, tokenMint]
    }))

    for (let reply of replies) {
        let tokenMint = mints.get(reply.message)
        if (tokenMint == null) {
            tokenMint = assertNotNull(await ctx.store.get(TokenMint, reply.message))
        }
        tokenMint.successful = reply.code == 0
        mints.set(tokenMint.id, tokenMint)
    }

    await ctx.store.save([...accounts.values()])
    await ctx.store.save([...mints.values()])
})


interface MintRecord {
    id: string
    name: string
    description: string
    media: string
    reference: string
    account: string
    successful?: boolean
}


interface Reply {
    message: string
    code: number
}


async function extractMintsAndReplies(ctx: Ctx): Promise<{records: MintRecord[], replies: Reply[]}> {
    let records: MintRecord[] = [];
    let replies: Reply[] = [];
    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.kind != 'event') continue
            if (item.event.name == 'Gear.MessageEnqueued') {
                if (item.event.call.name != 'Gear.send_message') continue
                let input = await decodeNFTInput(item.event.call.args.payload)
                if ('mint' in input) {
                    records.push({
                        id: item.event.args.id,  // message_id
                        name: input.mint.tokenMetadata.name,
                        description: input.mint.tokenMetadata.description,
                        media: input.mint.tokenMetadata.media,
                        reference: input.mint.tokenMetadata.reference,
                        account: item.event.args.source,
                    })
                }
            } else if (item.event.name == 'Gear.UserMessageSent') {
                let [message, code] = item.event.args.message.reply
                replies.push({message, code})
            }
        }
    }
    return { records, replies }
}
