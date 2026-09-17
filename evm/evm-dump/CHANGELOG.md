# Change Log - @subsquid/evm-dump

This log was last generated on Mon, 14 Sep 2026 10:05:38 GMT and should not be manually modified.

## 0.2.0
Mon, 14 Sep 2026 10:05:38 GMT

### Minor changes

- Add `--head-poll-interval`, defaulting to 1000ms, so a caught-up dumper stops re-asking for the chain head ten times a second.
- add --verify-ext-data-hash flag: check blockExtraData against the extDataHash header commitment

## 0.1.0
Thu, 30 Jul 2026 15:44:58 GMT

### Minor changes

- add a call-frame validation mode option to the EVM archiver CLI

## 0.0.5
Wed, 15 Jul 2026 22:15:56 GMT

_Version update only_

## 0.0.4
Wed, 15 Jul 2026 01:21:06 GMT

_Version update only_

## 0.0.3
Tue, 14 Jul 2026 13:09:33 GMT

_Version update only_

## 0.0.2
Mon, 01 Jun 2026 19:32:22 GMT

### Patches

- Adding support for debug_traceBlockByNumber

## 0.0.1
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init EVM dump CLI

