# @subsquid/eth-ingest

Data fetcher for ethereum compatible chains.

It dumps chain blocks (headers, transactions and logs) as JSON lines to stdout.

## Usage

```
npm install -g @subsquid/eth-ingest
```

```
Usage: squid-eth-ingest [options]

Data fetcher for ethereum compatible chains

Options:
  -e, --endpoint <url...>  http rpc endpoint
  --concurrency <number>   maximum number of pending data requests allowed (default: 5)
  --from-block <number>    first block to ingest
  --to-block <number>      last block to ingest
```
