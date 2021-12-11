import {SubstrateProcessor} from "@subsquid/substrate-processor"

const processor = new SubstrateProcessor('kusama')

// Archive GraphQL endpoint to fetch data
processor.setIndexer('https://kusama.indexer.gc.subsquid.io/v4/graphql')

processor.run()
