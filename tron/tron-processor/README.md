# @subsquid/tron-processor

Data fetcher and mappings executor for [TRON](https://tron.network).

## Data sources

* **SQD Portal** (`.setPortal()`) serves finalized blocks, many times faster than the HTTP API.
* **TRON HTTP API** (`.setHttpApi()`) serves the blocks above the portal's finalized head,
  including unfinalized ones, so the processor stays real-time.

At least one of them must be set.

```ts
import {TronBatchProcessor} from '@subsquid/tron-processor'

const processor = new TronBatchProcessor()
    .setPortal('https://portal.sqd.dev/datasets/tron-mainnet')
    .setHttpApi({url: 'https://api.trongrid.io'})
    .addLog({
        where: {
            address: ['a614f803b6fd780986a42c78ec9c7f77e6ded13c'],
            topic0: ['ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef']
        },
        include: {transaction: true}
    })
```

Without `.setHttpApi()`, only finalized blocks served by the portal are processed.
Without `.setPortal()`, all blocks are fetched from the HTTP API.

## Migrating from 0.x

Version 1 reads from SQD Portal instead of the SQD Network v2 archive (gateway).
Version 0.x stays available on npm and in the
[`archive/tron-processor-v0`](https://github.com/subsquid/squid-sdk/tree/archive/tron-processor-v0) branch.

| 0.x | 1.x |
|---|---|
| `.setGateway('https://v2.archive.subsquid.io/network/tron-mainnet')` | `.setPortal('https://portal.sqd.dev/datasets/tron-mainnet')` |
| `GatewaySettings` | `PortalSettings` |

Requests, field selection and the data model are unchanged. An already synced squid needs
no resync: point it to the portal and restart it.
