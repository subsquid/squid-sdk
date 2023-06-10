# Change Log - @subsquid/evm-processor

This log was last generated on Sat, 10 Jun 2023 15:11:08 GMT and should not be manually modified.

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

