# Change Log - @subsquid/substrate-processor

This log was last generated on Wed, 26 Jan 2022 13:21:07 GMT and should not be manually modified.

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

