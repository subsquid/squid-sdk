import {SubstrateProcessor} from "@subsquid/substrate-processor"

const processor = new SubstrateProcessor('kusama_balances')

processor.setDataSource('https://kusama.indexer.gc.subsquid.io/v4/graphql')

processor.run()
