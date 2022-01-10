# Change Log - @subsquid/substrate-processor

This log was last generated on Mon, 10 Jan 2022 17:09:28 GMT and should not be manually modified.

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

