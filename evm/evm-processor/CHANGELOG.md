# Change Log - @subsquid/evm-processor

This log was last generated on Thu, 28 Sep 2023 20:58:19 GMT and should not be manually modified.

## 1.8.3
Thu, 28 Sep 2023 20:58:19 GMT

### Patches

- update dependencies
- compile with TypeScript 5
- ignore STOP debug frame

## 1.8.2
Tue, 12 Sep 2023 08:42:04 GMT

### Patches

- don't warn users on partial archive unavailability which is part of its normal operation

## 1.8.1
Wed, 06 Sep 2023 13:16:47 GMT

### Patches

- prefer `alchemy_getTransactionReceipts` over `eth_getBlockReceipts`

## 1.8.0
Tue, 08 Aug 2023 21:22:05 GMT

### Minor changes

- allow to configure archive request timeout and increase the default up to 180 seconds

## 1.7.3
Thu, 20 Jul 2023 23:47:03 GMT

### Patches

- fix `TypeError: Cannot convert null to a BigInt` during data mapping

## 1.7.2
Wed, 19 Jul 2023 16:48:14 GMT

### Patches

- handle `null` results from receipt RPC requests
- adapt for refactored processor tools

## 1.7.1
Thu, 29 Jun 2023 10:25:09 GMT

### Patches

- handle `query returned more than 10000 results` error for logs requests

## 1.7.0
Tue, 20 Jun 2023 11:29:34 GMT

### Minor changes

- fix: handle `INVALID` debug frame as a regular call"

### Patches

- handle `null` results from `eth_getBlockByNumber`

## 1.6.0
Mon, 19 Jun 2023 22:07:46 GMT

### Minor changes

- expose `ctx._chain.client.batchCall()`

### Patches

- fix unhandled promise rejection crashes
- skip `INVALID` debug frames

## 1.5.1
Wed, 14 Jun 2023 23:56:25 GMT

### Patches

- decrease probability of consistency errors while fetching hot blocks

## 1.5.0
Wed, 14 Jun 2023 08:58:04 GMT

### Minor changes

- handle `ConsistencyError` with exponential backoff and warnings
- move RPC client logs to `sqd:processor:rpc` namespace

## 1.4.0
Sun, 11 Jun 2023 23:05:24 GMT

### Minor changes

- add ability to request logs by `topic1-topic3`

## 1.3.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- add `.rateLimit` option to RPC connection settings
- downgrade `TypeScript` to `4.9.5`

### Patches

- fix: `eth_getBlockReceipts` doesn't accept block hash on some endpoints
- catch `Expect block number from id` as concisitency error

## 1.2.0
Sat, 10 Jun 2023 15:11:08 GMT

### Minor changes

- optimise cost of RPC ingestion by better selection of used methods
- always use debug_traceBlockByHash to fetch state diffs of non-finalized blocks to guarantee data consistency
- rename `EvmBatchProcessor.useTraceApi()` to `EvmBatchProcessor.preferTraceApi()`
- add `TraceRequest.parents` option
- migrate to TypeScript 5 and update other dependencies

## 1.1.0
Mon, 05 Jun 2023 09:30:42 GMT

### Minor changes

- adapt for new processor tools

## 1.0.1
Mon, 08 May 2023 12:14:55 GMT

### Patches

- not all transaction fields where passed to the data handler

## 1.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- Introduce ArrowSquid

