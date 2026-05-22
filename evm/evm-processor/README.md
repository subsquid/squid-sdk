# @subsquid/evm-processor

Data fetcher and mappings executor for evm chains.

## Data source

Version 2 streams EVM data from SQD Portal via `@subsquid/evm-stream` and runs mappings with `@subsquid/batch-processor`.

```ts
import {EvmBatchProcessor} from '@subsquid/evm-processor'

const processor = new EvmBatchProcessor()
    .setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet')
```

RPC settings are retained for mappings that still access `ctx._chain.client`, but RPC is not used for data ingestion.
