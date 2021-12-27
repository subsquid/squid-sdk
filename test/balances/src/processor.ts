import {SubstrateProcessor} from "@subsquid/substrate-processor"

const processor = new SubstrateProcessor('kusama_balances')

processor.setDataSource({
    archive: 'https://kusama.indexer.gc.subsquid.io/v4/graphql',
    chain: 'wss://kusama-rpc.polkadot.io'
})

processor.run()
