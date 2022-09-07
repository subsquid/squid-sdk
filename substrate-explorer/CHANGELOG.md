# Change Log - @subsquid/substrate-explorer

This log was last generated on Wed, 07 Sep 2022 20:52:29 GMT and should not be manually modified.

## 2.0.0
Wed, 07 Sep 2022 20:52:29 GMT

### Breaking changes

- remove default sql statement timeout (customizable via `DB_STATEMENT_TIMEOUT_MS`)
- fix the number of open db connections (defaults to 5, customizable via `DB_CONNECTIONS`)

## 1.1.0
Tue, 30 Aug 2022 09:15:59 GMT

### Minor changes

- setup response size limits

## 1.0.0
Wed, 17 Aug 2022 17:33:52 GMT

### Breaking changes

- expose newly indexed `block.state_root`, `block.extrinsics_root`
- backed by new openreader
- set sql statement timeout to 2 seconds
- limit request size to 64kb

## 0.0.0
Sun, 26 Jun 2022 21:17:38 GMT

_Initial release_

