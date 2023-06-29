# Change Log - @subsquid/typeorm-store

This log was last generated on Thu, 29 Jun 2023 10:25:09 GMT and should not be manually modified.

## 1.2.1
Thu, 29 Jun 2023 10:25:09 GMT

### Patches

- escape status schema everywhere

## 1.2.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- downgrade `TypeScript` to `4.9.5`

## 1.1.0
Sat, 10 Jun 2023 15:11:09 GMT

### Minor changes

- support hot blocks by default
- migrate to TypeScript 5 and update other dependencies

## 1.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- Introduce ArrowSquid

## 0.2.2
Sun, 12 Feb 2023 16:50:59 GMT

### Patches

- downgrade `typeorm` to `^0.3.11` due to problems on Windows

## 0.2.1
Thu, 09 Feb 2023 15:10:00 GMT

### Patches

- upgrade dependencies

## 0.2.0
Thu, 29 Dec 2022 19:19:37 GMT

### Minor changes

- rename `Store.save()` to `Store.upsert()`, but preserve `.save()` as an alias

## 0.1.5
Fri, 28 Oct 2022 12:04:58 GMT

_Version update only_

## 0.1.4
Thu, 29 Sep 2022 15:37:49 GMT

### Patches

- clarify inline docs for `Store.save()` as doing upsert

## 0.1.3
Wed, 07 Sep 2022 20:52:29 GMT

### Patches

- fix: `Store.save()` can clear foreign keys on multi-row update
- don't open transaction for noop operations

## 0.1.2
Wed, 17 Aug 2022 17:33:52 GMT

_Version update only_

## 0.1.1
Thu, 07 Jul 2022 15:00:50 GMT

### Patches

- refactor tests

## 0.1.0
Fri, 24 Jun 2022 22:07:05 GMT

### Minor changes

- change `Store.remove()` to use primitive `DELETE`
- typeorm upgrade from `0.2.x` to `0.3.6`

### Patches

- upgrade dependencies
- improve inline docs
- add unit tests for Store

## 0.0.1
Sun, 19 Jun 2022 21:26:31 GMT

_Initial release_

