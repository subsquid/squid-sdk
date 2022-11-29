# Change Log - @subsquid/substrate-typegen

This log was last generated on Sun, 27 Nov 2022 18:43:31 GMT and should not be manually modified.

## 1.5.1
Sun, 27 Nov 2022 18:43:31 GMT

_Version update only_

## 1.5.0
Sun, 06 Nov 2022 18:24:20 GMT

### Minor changes

- decode `Option<Option<T>>` to `Option<T | undefined>`

## 1.4.2
Fri, 28 Oct 2022 12:04:58 GMT

_Version update only_

## 1.4.1
Sat, 15 Oct 2022 11:43:02 GMT

_Version update only_

## 1.4.0
Fri, 14 Oct 2022 13:59:14 GMT

### Minor changes

- support polkadotjs types bundles

## 1.3.0
Wed, 07 Sep 2022 20:52:29 GMT

### Minor changes

- support `storage.getAll...()` API

## 1.2.2
Wed, 17 Aug 2022 17:33:52 GMT

_Version update only_

## 1.2.1
Thu, 04 Aug 2022 06:00:53 GMT

_Version update only_

## 1.2.0
Tue, 19 Jul 2022 03:09:10 GMT

### Minor changes

- refactor type name assignment procedure (might affect names of some generated types)

## 1.1.0
Wed, 06 Jul 2022 09:25:54 GMT

### Minor changes

- add support for runtime constants

## 1.0.2
Fri, 24 Jun 2022 22:07:05 GMT

### Patches

- upgrade dependencies

## 1.0.1
Sun, 19 Jun 2022 21:47:17 GMT

_Version update only_

## 1.0.0
Sun, 19 Jun 2022 21:26:31 GMT

### Breaking changes

- Introduce FireSquid

## 0.5.0
Thu, 12 May 2022 15:07:10 GMT

### Minor changes

- support `.getMany...()` queries for storage items

## 0.4.3
Thu, 05 May 2022 20:47:14 GMT

### Patches

- fix handling of storage maps with multiple hashers and tuple key

## 0.4.2
Wed, 20 Apr 2022 22:55:27 GMT

### Patches

- upgrade `commander` to `^9.0.0`

## 0.4.1
Sat, 26 Mar 2022 16:32:43 GMT

### Patches

- fix return type of optional storage items
- don't generate `.get()` methods for storage items which can't hold any value

## 0.4.0
Mon, 14 Mar 2022 18:47:21 GMT

### Minor changes

- add `.isExists` property to storage classes to test for storage item existence

### Patches

- don't throw from `.isV*` methods of storage classes when item doesn't exist in current chain version

## 0.3.0
Fri, 11 Mar 2022 07:38:31 GMT

### Minor changes

- typesafe classes for storage requests

## 0.2.3
Fri, 04 Mar 2022 14:30:51 GMT

_Version update only_

## 0.2.2
Wed, 02 Mar 2022 18:11:28 GMT

_Version update only_

## 0.2.1
Mon, 07 Feb 2022 15:16:41 GMT

_Version update only_

## 0.2.0
Wed, 02 Feb 2022 11:01:32 GMT

### Minor changes

- breaking: assign better names to event and call types
- breaking: normalize inline option types to `T | undefined`
- breaking: normalize inline result types to `Result<Ok, Err>`
- allow to generate all events or calls via `events: true` / `calls: true` option

### Patches

- correctly generate type for compact structs and tuples

## 0.1.0
Tue, 25 Jan 2022 12:44:12 GMT

### Minor changes

- deprecate `.isLatest`, `.asLatest`

### Patches

- fix code for extrinsics with underscore in the name

## 0.0.6
Thu, 20 Jan 2022 08:42:53 GMT

### Patches

- include src files into npm package

## 0.0.5
Tue, 18 Jan 2022 09:31:27 GMT

### Patches

- change license to GPL3

## 0.0.4
Thu, 13 Jan 2022 16:05:36 GMT

### Patches

- Don't rely on block ranges for type compatibility checks

## 0.0.3
Mon, 10 Jan 2022 17:09:28 GMT

_Version update only_

## 0.0.2
Tue, 04 Jan 2022 10:40:43 GMT

### Patches

- fix shebang in executable

## 0.0.1
Mon, 03 Jan 2022 16:07:32 GMT

### Patches

- set `publishConfig.access` to `public`

## 0.0.0
Mon, 03 Jan 2022 12:24:26 GMT

_Initial release_

