# @subsquid/substrate-processor

Data fetcher and mappings executor for [substrate](https://substrate.io) chains.

## Data sources

The processor reads blocks from two sources:

* **SQD Portal** (`.setPortal()`, optional) serves finalized blocks, many times faster than RPC.
* **Chain RPC** (`.setRpcEndpoint()`, required) is always used to fetch runtime metadata. It also
  serves every block above the portal's finalized head, including unfinalized ones, so the
  processor stays real-time.

```ts
import {SubstrateBatchProcessor} from '@subsquid/substrate-processor'

const processor = new SubstrateBatchProcessor()
    .setPortal('https://portal.sqd.dev/datasets/kusama')
    .setRpcEndpoint('wss://kusama-rpc.polkadot.io')
    .addEvent({name: ['Balances.Transfer']})
```

Without `.setPortal()`, all blocks are fetched from the RPC endpoint.
With `.setRpcDataIngestionSettings({disabled: true})`, only finalized blocks served
by the portal are processed.

Historical blocks need runtime metadata from the RPC endpoint, so it must be an archive node.

## Migrating from 8.x

Version 9 reads from SQD Portal instead of the SQD Network v2 archive (gateway).
Version 8 stays available on npm and in the
[`archive/substrate-processor-v8`](https://github.com/subsquid/squid-sdk/tree/archive/substrate-processor-v8) branch.

| 8.x | 9.x |
|---|---|
| `.setGateway(url)`, `.setArchive(url)` | `.setPortal(url)` with a portal dataset URL, e.g. `https://portal.sqd.dev/datasets/<dataset>` |
| `.setDataSource({archive, chain})` | `.setPortal(archive)` and `.setRpcEndpoint(chain)` |
| `GatewaySettings`, `ArchiveSettings` | `PortalSettings` |

Some networks are named differently on the portal (e.g. `astar` is `astar-substrate`). The list of datasets is at
`https://portal.sqd.dev/datasets`. If a network is not served by the portal, drop the gateway
call and the processor will fetch everything from the RPC endpoint.

An already synced squid needs no resync: point it to the portal (or to RPC only) and restart it.
