# Change Log - @subsquid/substrate-processor

This log was last generated on Tue, 07 May 2024 07:40:43 GMT and should not be manually modified.

## 8.3.1
Tue, 07 May 2024 07:40:43 GMT

_Version update only_

## 8.3.0
Tue, 09 Apr 2024 17:45:37 GMT

### Minor changes

- Allow to configure RPC HTTP headers

## 8.2.2
Sun, 17 Mar 2024 23:20:20 GMT

_Version update only_

## 8.2.1
Thu, 29 Feb 2024 15:27:11 GMT

_Version update only_

## 8.2.0
Wed, 21 Feb 2024 19:22:05 GMT

### Minor changes

- add field selection schema validation

## 8.1.1
Mon, 01 Jan 2024 14:37:34 GMT

### Patches

- fix archive error when limiting item request by block range

## 8.1.0
Wed, 20 Dec 2023 07:15:52 GMT

### Minor changes

-  rename `.setArchive()` to `.setGateway()`

## 8.0.0
Fri, 01 Dec 2023 16:55:51 GMT

### Breaking changes

- gear: `Gear.MessageEnqueued` was renamed to `Gear.MessageQueued`

### Minor changes

- support chain head tracking via RPC subscription
- deprecate `.setDataSource()` in favour of separate `.setArchive()` and `.setRpcEndpoint()` methods
- introduce `.setRpcDataIngestionSettings()` and deprecate `.setChainPollInterval()`, `.useArchiveOnly()`

### Patches

- update dependencies
- add `Chain.client` alias for compatibility with `evm-typegen` (closes #212)

## 7.2.1
Thu, 19 Oct 2023 08:58:05 GMT

_Version update only_

## 7.2.0
Sat, 14 Oct 2023 22:24:52 GMT

### Minor changes

- add `.useArchiveOnly()` option

## 7.1.0
Wed, 11 Oct 2023 19:13:41 GMT

### Minor changes

- implement block item filtering for RPC data source

## 7.0.0
Thu, 28 Sep 2023 20:58:19 GMT

### Breaking changes

- change bit sequence JS representation in decoded data

### Minor changes

- add `extrinsic.encode()`, `call.encode()` functions

### Patches

- update dependencies
- compile with TypeScript 5

## 6.0.2
Wed, 13 Sep 2023 22:16:51 GMT

_Version update only_

## 6.0.1
Tue, 12 Sep 2023 08:42:04 GMT

### Patches

- don't warn users on partial archive unavailability which is part of its normal operation

## 6.0.0
Tue, 05 Sep 2023 20:32:34 GMT

### Breaking changes

- migrate to new substrate runtime packages

### Patches

- fix event `call.events` assignment

## 5.1.0
Fri, 04 Aug 2023 07:25:15 GMT

### Minor changes

- introduce ArrowSquid archive

## 5.0.1
Wed, 02 Aug 2023 22:59:19 GMT

### Patches

- upgrade `substrate-data` dependency

## 5.0.0
Tue, 01 Aug 2023 16:40:12 GMT

### Breaking changes

- migrate to per block runtime tracking

## 4.0.1
Thu, 27 Jul 2023 13:21:04 GMT

_Version update only_

## 4.0.0
Wed, 19 Jul 2023 16:48:14 GMT

### Breaking changes

- actually introduce `ArrowSquid`

## 3.3.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- downgrade `TypeScript` to `4.9.5`

## 3.2.0
Sat, 10 Jun 2023 15:11:09 GMT

### Minor changes

- migrate to TypeScript 5 and update other dependencies

## 3.1.0
Mon, 05 Jun 2023 09:30:42 GMT

### Minor changes

- adapt for new processor tools

## 3.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- Introduce ArrowSquid

## 2.4.1
Sat, 25 Feb 2023 19:16:49 GMT

### Patches

- refactor `util-internal-http-client` import

## 2.4.0
Sun, 19 Feb 2023 09:15:04 GMT

### Minor changes

- reflect in types, that `.addEthereumTransaction()` will result in `Ethereum.Executed` events being present as well

## 2.3.1
Sun, 12 Feb 2023 12:16:19 GMT

_Version update only_

## 2.3.0
Thu, 09 Feb 2023 15:10:00 GMT

### Minor changes

- support `http(s)` RPC endpoints

## 2.2.0
Thu, 29 Dec 2022 19:19:37 GMT

### Minor changes

- add `BatchContext.isHead` property to signal when the processor is on the top of a chain
- pass `isHead` flag to `Database.advance()`

## 2.1.0
Wed, 30 Nov 2022 19:36:06 GMT

### Minor changes

- new `ctx._chain` functions for quering storage

### Patches

- remove unused imports

## 2.0.2
Sun, 27 Nov 2022 18:43:31 GMT

_Version update only_

## 2.0.1
Sun, 06 Nov 2022 18:24:20 GMT

_Version update only_

## 2.0.0
Fri, 28 Oct 2022 12:04:58 GMT

### Breaking changes

- migrate to new gateway interface for data fetching

## 1.10.1
Sat, 15 Oct 2022 11:43:02 GMT

_Version update only_

## 1.10.0
Fri, 14 Oct 2022 13:59:14 GMT

### Minor changes

- support polkadotjs types bundles

### Patches

- fix some event type derivation issues
- fix derived type of `call.success` property, it should be always present regardless of data selection

## 1.9.1
Thu, 22 Sep 2022 15:21:10 GMT

### Patches

- fix evm log handling issue due to `EVM.Log` event type upgrade

## 1.9.0
Thu, 15 Sep 2022 20:54:52 GMT

### Minor changes

- Add special support for `EVM.Executed` and `EVM.ExecutedFailed` events from Acala network

### Patches

- retrieve validator from indexer gateway

## 1.8.0
Wed, 07 Sep 2022 20:52:29 GMT

### Minor changes

- support `storage.getAll...()` API
- add `.stateRoot` and `.extrinsicsRoot` fields to block header

## 1.7.0
Mon, 22 Aug 2022 15:27:06 GMT

### Minor changes

- Add specialized support for `Ethereum.transact` calls
- Allow to pass multiple contract addresses to `.addEvmLog()`, `.addEthereumTransaction()` and their handler counterparts

### Patches

- Throw a proper error when required metadata is absent in archive

## 1.6.0
Wed, 17 Aug 2022 17:33:52 GMT

### Minor changes

- support gear network events

### Patches

- fix: not all evm log handlers where fired due to incorrect topic filtering
- fix evm log fields in gateway request
- remove `id`, `pos`, `name` fields from data selection types as expected by the gateway
- adapt for new `EVM.Log` event arguments

## 1.5.1
Thu, 04 Aug 2022 06:00:53 GMT

### Patches

- add `X-SQUID-ID` HTTP header to archive requests

## 1.5.0
Tue, 19 Jul 2022 03:09:10 GMT

### Minor changes

- convert contract addresses to lower case in configuration methods

## 1.4.1
Sun, 10 Jul 2022 13:47:35 GMT

### Patches

- fix `SubstrateBatchProcessor` item type derivation

## 1.4.0
Thu, 07 Jul 2022 15:00:50 GMT

### Minor changes

- make `SubstrateBatchProcessor` mutable
- add chaining to `SubstrateProcessor` configuration methods

## 1.3.0
Wed, 06 Jul 2022 09:25:54 GMT

### Minor changes

- improve batch processor item type derivation 
- support typesafe wrappers for chain constants
- support wildcard requests and handlers for events and calls

## 1.2.0
Mon, 27 Jun 2022 12:07:48 GMT

### Minor changes

- handle only successful calls by default in `SubstrateProcessor.addCallHandler()`

## 1.1.1
Fri, 24 Jun 2022 22:07:05 GMT

### Patches

- upgrade dependencies
- improve inline docs

## 1.1.0
Wed, 22 Jun 2022 13:18:45 GMT

### Minor changes

- export `BatchProcessorEventItem<T>`, `BatchProcessorCallItem<T>`

### Patches

- improve inline docs
- tweak processing status log message
- fix storage multi-key requests, when list of keys is empty

## 1.0.1
Sun, 19 Jun 2022 21:47:17 GMT

_Version update only_

## 1.0.0
Sun, 19 Jun 2022 21:26:31 GMT

### Breaking changes

- Introduce FireSquid

## 0.8.0
Thu, 12 May 2022 15:07:10 GMT

### Minor changes

- support `.getMany...()` queries for storage items

## 0.7.2
Thu, 05 May 2022 20:47:14 GMT

### Patches

- use `int4` in status table for cockroach compatibility

## 0.7.1
Wed, 20 Apr 2022 22:55:27 GMT

### Patches

- add inline docs to `SubstrateProcessor`

## 0.7.0
Fri, 08 Apr 2022 10:15:29 GMT

### Minor changes

- add validator to SubstrateBlock

## 0.6.1
Sat, 26 Mar 2022 16:32:43 GMT

### Patches

- implement missing storage hashers

## 0.6.0
Mon, 14 Mar 2022 18:47:21 GMT

### Minor changes

- internal changes to support storage item existence tests from typegen classes

## 0.5.0
Fri, 11 Mar 2022 07:38:31 GMT

### Minor changes

- add support for storage requests

## 0.4.1
Fri, 04 Mar 2022 14:30:51 GMT

_Version update only_

## 0.4.0
Wed, 02 Mar 2022 18:11:28 GMT

### Minor changes

- support special processing for `evm.Log` events
- allow not to `.setTypesBundle()` for known chains

## 0.3.0
Mon, 07 Feb 2022 15:16:41 GMT

### Minor changes

- allow to customize transaction isolation level

### Patches

- handle camelCase call names within `ctx._chain.decodeCall()`
- handle tx serialization failures

## 0.2.6
Wed, 02 Feb 2022 11:01:32 GMT

### Patches

- upgrade dependencies

## 0.2.5
Wed, 26 Jan 2022 13:21:07 GMT

### Patches

- prevent quadratic sizes of fetched data
- fix graphql error handling

## 0.2.4
Tue, 25 Jan 2022 12:44:12 GMT

### Patches

- fix fetching of extrinsics with underscore in the name

## 0.2.3
Thu, 20 Jan 2022 08:42:53 GMT

### Patches

- include src files into npm package

## 0.2.2
Tue, 18 Jan 2022 09:31:27 GMT

### Patches

- change license to GPL3

## 0.2.1
Sun, 16 Jan 2022 18:13:02 GMT

_Version update only_

## 0.2.0
Thu, 13 Jan 2022 16:05:36 GMT

### Minor changes

- Provide event.extrinsicId in the block header

### Patches

- Fix decoding errors for variant types (when using typegen classes)

## 0.1.1
Mon, 10 Jan 2022 17:09:28 GMT

### Patches

- use new `@subsquid/scale-codec-json` for archive data

## 0.1.0
Sat, 08 Jan 2022 13:00:12 GMT

### Minor changes

- rename metric: `substrate_processor:last_processed_block` to `sqd_processor_last_block`
- rename metric: `substrate_processor:chain_height` to `sqd_processor_chain_height`
- add metric: `sqd_processor_mapping_blocks_per_second`
- add metric: `sqd_processor_ingest_blocks_per_second`
- add metric: `sqd_processor_sync_eta_seconds`
- add metric: `sqd_processor_sync_ratio`

### Patches

- fix possibility of double ingestion
- recover from chain connection losses

## 0.0.1
Mon, 03 Jan 2022 16:07:32 GMT

### Patches

- set `publishConfig.access` to `public`

## 0.0.0
Mon, 03 Jan 2022 12:24:26 GMT

_Initial release_

