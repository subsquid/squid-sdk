# Change Log - @subsquid/substrate-processor

This log was last generated on Thu, 05 May 2022 20:47:14 GMT and should not be manually modified.

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

