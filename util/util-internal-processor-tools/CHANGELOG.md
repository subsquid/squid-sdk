# Change Log - @subsquid/util-internal-processor-tools

This log was last generated on Wed, 17 Apr 2024 12:46:35 GMT and should not be manually modified.

## 4.1.1
Wed, 17 Apr 2024 12:46:35 GMT

### Patches

- factor out `getOrGenerateSquidId()` function into a separate package

## 4.1.0
Sun, 17 Mar 2024 23:20:20 GMT

### Minor changes

- introduce `Database.transactHot2()` protocol to process finalized blocks faster within hot processing context
- refresh chain height metric once in 20 seconds

## 4.0.2
Thu, 29 Feb 2024 15:27:11 GMT

_Version update only_

## 4.0.1
Tue, 23 Jan 2024 16:47:41 GMT

### Patches

- always switch to RPC after reaching the archive head (even for databases that don't support hot blocks)

## 4.0.0
Fri, 01 Dec 2023 16:55:51 GMT

### Breaking changes

- migrate to callback based hot data ingestion
- remove ingest tools

### Minor changes

- add item filtering tools

### Patches

- update dependencies

## 3.1.0
Sat, 14 Oct 2023 22:24:52 GMT

### Minor changes

- allow `DataSource.getBlockHash(height: number)` to return `null` or `undefined`

## 3.0.0
Thu, 28 Sep 2023 20:58:19 GMT

### Breaking changes

- replace prometheus rpc connection metrics with `sqd_rpc_request_count[url, kind]`

### Patches

- update dependencies
- compile with TypeScript 5

## 2.0.0
Wed, 19 Jul 2023 16:48:14 GMT

### Breaking changes

- moving things around in preparation to support substrate networks

## 1.2.3
Thu, 15 Jun 2023 10:53:31 GMT

### Patches

- fix: allow to index FireSquid databases

## 1.2.2
Wed, 14 Jun 2023 23:56:25 GMT

### Patches

- handle the case when the range of requested blocks is above the finalized head

## 1.2.1
Sun, 11 Jun 2023 23:05:24 GMT

### Patches

- fix `.isHead` definition for archive data batches

## 1.2.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- downgrade `TypeScript` to `4.9.5`

### Patches

- update chain height metric after switching to a hot datasource

## 1.1.0
Sat, 10 Jun 2023 15:11:09 GMT

### Minor changes

- migrate to TypeScript 5 and update other dependencies

### Patches

- add assertion, that we are staying on the same chain while switching between data sources or after restarts

## 1.0.0
Mon, 05 Jun 2023 09:30:42 GMT

### Breaking changes

- rework data ingestion

## 0.0.1
Mon, 01 May 2023 18:57:46 GMT

_Initial release_

