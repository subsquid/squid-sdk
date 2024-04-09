# Change Log - @subsquid/util-internal

This log was last generated on Sun, 17 Mar 2024 23:20:20 GMT and should not be manually modified.

## 3.1.0
Sun, 17 Mar 2024 23:20:20 GMT

### Minor changes

- add `concurrentWriter()` function

### Patches

- fix handling of destroyed/errored streams in `waitDrain()`
- fix unhandled promise rejection crash in `concurrentMap()`

## 3.0.0
Fri, 01 Dec 2023 16:55:51 GMT

### Breaking changes

- rework `AsyncQueue`

### Minor changes

- add `weakMemo()`, `partitionBy()`, `safeCall()` functions

### Patches

- update dependencies

## 2.5.2
Thu, 28 Sep 2023 20:58:19 GMT

### Patches

- update dependencies
- compile with TypeScript 5

## 2.5.1
Thu, 07 Sep 2023 20:03:29 GMT

### Patches

- fix `@annotateAsyncError()`

## 2.5.0
Tue, 01 Aug 2023 16:40:12 GMT

### Minor changes

- introduce `annotateSyncError` and `annotateAsyncError` decorators 

## 2.4.0
Wed, 19 Jul 2023 16:48:14 GMT

### Minor changes

- Introduce `Throttler`

## 2.3.1
Mon, 19 Jun 2023 22:07:46 GMT

### Patches

- fix unhandled promise rejection crashes

## 2.3.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- downgrade `TypeScript` to `4.9.5`

## 2.2.0
Sat, 10 Jun 2023 15:11:09 GMT

### Minor changes

- migrate to TypeScript 5 and update other dependencies

## 2.1.0
Mon, 05 Jun 2023 09:30:42 GMT

### Minor changes

- add async utilities
- add slice splitting functions

## 2.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- Introduce ArrowSquid

## 1.1.0
Thu, 09 Feb 2023 15:10:00 GMT

### Minor changes

- add abort signal option to `wait()`

## 1.0.0
Fri, 28 Oct 2022 12:04:58 GMT

### Breaking changes

- remove unused functions

## 0.0.1
Fri, 24 Jun 2022 22:07:05 GMT

### Patches

- upgrade dependencies

## 0.0.0
Sun, 19 Jun 2022 21:26:31 GMT

_Initial release_

