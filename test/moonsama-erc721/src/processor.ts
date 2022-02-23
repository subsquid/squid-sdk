import {SubstrateEvmProcessor} from "@subsquid/substrate-evm-processor"


const processor = new SubstrateEvmProcessor('erc721')


processor.setBatchSize(500)
processor.setTypesBundle('moonriver')
processor.setDataSource({
    chain: 'wss://moonriver.api.onfinality.io/public-ws',
    archive: 'http://localhost:8080/v1/graphql'
})


processor.setBlockRange({from: 568970})


processor.addEvmLogHandler(
    '0x63f2adf5f76f00d48fe2cbef19000af13bb8de82',
    {
        topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
    },
    async ctx => {
        console.log('event :', ctx.substrate.event.id)
        console.log('contract: ', ctx.contractAddress)
        console.log('topics:', ctx.topics)
        console.log('data  :', ctx.data)
    }
)


processor.run()
