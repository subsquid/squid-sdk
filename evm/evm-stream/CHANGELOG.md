# Change Log - @subsquid/evm-stream

This log was last generated on Wed, 15 Jul 2026 22:15:56 GMT and should not be manually modified.

## 0.1.3
Wed, 15 Jul 2026 22:15:56 GMT

### Patches

- fix(portal): PortalEvmDataSource now honours StreamRequest.to — a bounded getStream/getFinalizedStream call terminates at `to` instead of ignoring it and following the chain head. This matches the RPC data source, so the two DataSource implementations agree on where a bounded stream ends. The production run() path is unaffected (it bounds via request ranges and never passes `to`); direct DataSource API consumers passing `to` were.

## 0.1.2
Wed, 08 Jul 2026 22:11:26 GMT

_Version update only_

## 0.1.1
Mon, 18 May 2026 10:40:02 GMT

### Patches

- remove @subsquid/rpc-client dependency

## 0.1.0
Thu, 14 May 2026 13:44:27 GMT

### Minor changes

- Drop DEFAULT_FIELDS; .setFields() is now the sole source of selected fields

## 0.0.1
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init EVM Portal stream API

