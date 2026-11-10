# Change Log - @subsquid/evm-data-service

This log was last generated on Tue, 10 Nov 2026 07:49:45 GMT and should not be manually modified.

## 0.3.0
Tue, 10 Nov 2026 07:49:45 GMT

### Minor changes

- Validate debug call frames and state diffs against receipt status, gasUsed and transaction fees (--consensus-anchor-validation, --consensus-anchor-rules)

### Patches

- Exit when data ingestion fails before the first block, instead of serving the initial block without ever restarting ingestion
- Report retried RPC errors from the worker threads

## 0.2.0
Mon, 14 Sep 2026 10:05:38 GMT

### Minor changes

- add --verify-ext-data-hash flag: check blockExtraData against the extDataHash header commitment

## 0.1.0
Thu, 30 Jul 2026 15:44:58 GMT

### Minor changes

- add a call-frame validation mode option for EVM data-service ingestion

## 0.0.9
Wed, 15 Jul 2026 22:15:56 GMT

_Version update only_

## 0.0.8
Wed, 15 Jul 2026 01:21:06 GMT

_Version update only_

## 0.0.7
Tue, 14 Jul 2026 13:09:33 GMT

_Version update only_

## 0.0.6
Mon, 01 Jun 2026 19:32:22 GMT

### Patches

- Adding support for debug_traceBlockByNumber

## 0.0.5
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init EVM data service

