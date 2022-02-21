import {SubstrateEvmProcessor} from "@subsquid/substrate-evm-processor"


const processor = new SubstrateEvmProcessor('erc721')


processor.setTypesBundle('moonriver')
processor.setDataSource({
    chain: 'wss://wss.moonriver.moonbeam.network',
    archive: 'https://moonriver-copy.indexer.gc.subsquid.io/v4/graphql'
})


processor.setBlockRange({from: 568970})


processor.addEvmLogHandler(
    '0xb654611f84a8dc429ba3cb4fda9fad236c505a1a',
    {
        topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
    },
    async ctx => {
        console.log('event :', ctx.substrate.event.id)
        console.log('topics:', ctx.topics)
        console.log('data  :', ctx.data)
    }
)


processor.run()
