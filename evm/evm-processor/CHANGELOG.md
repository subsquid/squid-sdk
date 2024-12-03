# Change Log - @subsquid/evm-processor

This log was last generated on Tue, 03 Dec 2024 11:47:42 GMT and should not be manually modified.

## 1.26.1
Tue, 03 Dec 2024 11:47:42 GMT

_Version update only_

## 1.26.0
Sun, 17 Nov 2024 06:01:50 GMT

### Minor changes

- add `tx.authorizationList` field

## 1.25.0
Thu, 14 Nov 2024 12:06:12 GMT

### Minor changes

- allow to filter transactions by type

## 1.24.0
Wed, 13 Nov 2024 11:28:41 GMT

### Minor changes

- add transactionStateDiffs to LogRequest

### Patches

- properly pass timeout to debug trace config

## 1.23.0
Fri, 01 Nov 2024 17:26:43 GMT

### Minor changes

- allow to configure number of rpc connection errors retry attempts

## 1.22.1
Thu, 24 Oct 2024 16:06:57 GMT

### Patches

- allow empty init in create trace

## 1.22.0
Wed, 09 Oct 2024 18:06:03 GMT

### Minor changes

- Introduce flags to make the RPC data validation checks optional

## 1.21.2
Fri, 20 Sep 2024 15:57:10 GMT

### Patches

- change type of `debugState.nonce` to `NAT`

## 1.21.1
Thu, 22 Aug 2024 09:03:21 GMT

### Patches

- traces: allow suicide calls to zero address

## 1.21.0
Wed, 21 Aug 2024 09:10:53 GMT

### Minor changes

- extend transaction with 'l1'-prefixed fields

## 1.20.0
Fri, 09 Aug 2024 13:17:49 GMT

### Minor changes

- always uppercase DebugFrame type field

## 1.19.2
Thu, 25 Jul 2024 11:48:18 GMT

### Patches

- make `DebugFrame.input` optional and add default value

## 1.19.1
Wed, 15 May 2024 10:11:41 GMT

### Patches

- ignore case in RPC error message parsing

## 1.19.0
Sun, 12 May 2024 13:49:00 GMT

### Minor changes

- handle "query returned more than N results" errors for logs requests, add fallback to fetching by receipts

### Patches

- match transactions and receipts by hash instead of index

## 1.18.1
Tue, 07 May 2024 07:40:43 GMT

_Version update only_

## 1.18.0
Tue, 09 Apr 2024 17:45:37 GMT

### Minor changes

- Allow to configure RPC HTTP headers

## 1.17.1
Sun, 17 Mar 2024 23:20:20 GMT

_Version update only_

## 1.17.0
Thu, 29 Feb 2024 15:27:11 GMT

### Minor changes

- fix debug trace validation for failed `CREATE` case and make `EvmTraceCreateResult.address` non-optional again

### Patches

- Handle Avalanche RPC inconsistency issues

## 1.16.0
Wed, 21 Feb 2024 19:22:05 GMT

### Minor changes

- add field selection schema validation
- update evm trace schema definition

## 1.15.0
Sat, 17 Feb 2024 17:47:08 GMT

### Minor changes

- extend `.addTrace()` with `callFrom` filter

## 1.14.1
Wed, 14 Feb 2024 20:01:22 GMT

_Version update only_

## 1.14.0
Tue, 23 Jan 2024 16:47:41 GMT

### Minor changes

- add transaction items to log and trace requests

## 1.13.0
Thu, 11 Jan 2024 18:08:14 GMT

### Minor changes

- add `l1BlockNumber` to block fields

## 1.12.2
Tue, 09 Jan 2024 20:23:26 GMT

### Patches

- do not output '=' state diffs when ingesting data from RPC

## 1.12.1
Tue, 09 Jan 2024 15:50:08 GMT

### Patches

- fix call trace parent-child relation setup

## 1.12.0
Mon, 01 Jan 2024 14:37:34 GMT

### Minor changes

- warn when debug trace is missing from transaction instead of hard error
- handle `INVALID` debug frame like a regular call

## 1.11.1
Fri, 29 Dec 2023 18:36:04 GMT

### Patches

- allow `null` sighash in archive call trace

## 1.11.0
Thu, 28 Dec 2023 19:59:01 GMT

### Minor changes

- support `debugTraceTimeout` RPC data ingestion option

### Patches

- allow empty `sighash` from archive
- report block fetch consistency errors in a mode detailed manner

## 1.10.2
Tue, 26 Dec 2023 16:11:36 GMT

### Patches

- fix: `sighash` is not set when ingesting data from RPC
- don't forget to filter state diffs when ingesting from RPC

## 1.10.1
Sun, 24 Dec 2023 20:05:50 GMT

### Patches

- allow missing `.gas`, `.gasUsed` fields in debug call trace

## 1.10.0
Wed, 20 Dec 2023 07:15:52 GMT

### Minor changes

- rename `.setArchive()` to `.setGateway()`

### Patches

- block timestamp should be in `ms`
- fix `BlockHeader.size` validation

## 1.9.0
Fri, 01 Dec 2023 16:55:51 GMT

### Minor changes

- introduce RPC data filtering
- support chain head tracking via RPC subscription
- improve hot block data ingestion speed via batch processing

### Patches

- update dependencies

## 1.8.5
Fri, 20 Oct 2023 17:49:18 GMT

### Patches

- handle `CALLCODE` debug frames

## 1.8.4
Sat, 14 Oct 2023 22:24:52 GMT

### Patches

- better handle case when hot datasource is behind already indexed finanlized head

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

