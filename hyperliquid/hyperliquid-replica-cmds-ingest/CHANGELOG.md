# Change Log - @subsquid/hyperliquid-replica-cmds-ingest

This log was last generated on Fri, 20 Nov 2026 14:01:48 GMT and should not be manually modified.

## 0.1.0
Fri, 20 Nov 2026 14:01:48 GMT

### Minor changes

- download each archive file as concurrent byte ranges (`--download-concurrency`, default 8), retrying a range that fails or stalls

### Patches

- log a positive block count per chunk

## 0.0.3
Tue, 10 Nov 2026 07:49:45 GMT

### Patches

- Update dependency ranges: @aws-sdk/client-s3 ^3.1136.0, lz4 ^0.6.5

## 0.0.2
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init Hyperliquid replica command ingest CLI

