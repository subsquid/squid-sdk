# @subsquid/tron-data-service

Hot block data service for TRON-based chains.

It fetches blocks from a TRON FullNode HTTP API, normalizes them and exposes a
stream of recent (hot) blocks over HTTP, to be consumed by the
[hotblocks](https://github.com/subsquid/data) service.

The service implements the same HTTP contract as the other `*-data-service`
packages (`/stream`, `/head`, `/finalized-head`, `/metrics`, ...) via
`@subsquid/util-internal-data-service`.

## Usage

```bash
node lib/main.js \
  --http-api https://api.trongrid.io \
  --block-cache-size 1000 \
  --port 3000
```

### Options

| Option | Description | Default |
| --- | --- | --- |
| `--http-api <url>` | TRON FullNode HTTP API url (required) | |
| `--http-api-stride-size <number>` | Size of an ingestion stride | `5` |
| `--http-api-stride-concurrency <number>` | Max number of concurrent ingestion strides | `5` |
| `--http-api-timeout <ms>` | HTTP API request timeout in ms | `30000` |
| `--http-api-head-poll-interval <ms>` | Interval between head polls in ms | `1000` |
| `--block-cache-size <number>` | Max number of blocks to buffer | `1000` |
| `-p, --port <number>` | Port to listen on | `3000` |
| `--auto-adjust-finalized-head` | Adjust finalized head when the block cache is full | off |

## Finality

The chain head (`wallet/getnowblock`) is reversible: TRON is DPoS and short
forks near the head are normal. A block becomes final once it is **solidified**
— confirmed by more than 2/3 of the Super Representatives (~18–19 blocks behind
the head). TRON exposes this point directly via `walletsolidity/getnowblock`,
which this service uses as the finalized head. Because finality is read straight
from the node, there is no fixed confirmation offset to configure and — unlike
the EVM data service — no separate finalized-block probing loop.

This assumes the same base URL serves both `/wallet/*` and `/walletsolidity/*`,
which holds for TronGrid and standard java-tron FullNodes.
