import {SubstrateEvmProcessor} from "@subsquid/substrate-evm-processor"
import * as erc721 from "./erc721"


const processor = new SubstrateEvmProcessor('erc721')


processor.setBatchSize(500)
processor.setTypesBundle('moonriver')
processor.setDataSource({
    chain: 'wss://moonriver.api.onfinality.io/public-ws',
    archive: 'http://localhost:8080/v1/graphql'
    // archive: 'https://moonriver-beta.indexer.gc.subsquid.io/v4/graphql'
})


processor.setBlockRange({from: 568970})


processor.addEvmLogHandler(
    '0xb654611f84a8dc429ba3cb4fda9fad236c505a1a',
    {
        topics: [erc721.events['Transfer(address,address,uint256)'].topic]
    },
    async ctx => {
        let transfer = erc721.events['Transfer(address,address,uint256)'].decode(ctx)
        console.log(transfer)
    }
)


processor.run()
