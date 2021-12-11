"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const substrate_processor_1 = require("@subsquid/substrate-processor");
const processor = new substrate_processor_1.SubstrateProcessor('kusama');
// Archive GraphQL endpoint to fetch data
processor.setIndexer('https://kusama.indexer.gc.subsquid.io/v4/graphql');
processor.run();
//# sourceMappingURL=index.js.map