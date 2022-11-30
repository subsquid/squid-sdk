# Change Log - @subsquid/scale-codec

This log was last generated on Sat, 15 Oct 2022 11:43:02 GMT and should not be manually modified.

## 1.0.5
Sat, 15 Oct 2022 11:43:02 GMT

_Version update only_

## 1.0.4
Thu, 29 Sep 2022 15:37:49 GMT

### Patches

- handle compact structs with single numeric field

## 1.0.3
Wed, 17 Aug 2022 17:33:52 GMT

### Patches

- always decode big compacts (`Compact<Uxx>` where `xx > 32`) as `bigint`

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

## 0.4.2
Wed, 20 Apr 2022 22:55:27 GMT

### Patches

- fix stackoverflow when checking long hex bytes

## 0.4.1
Sat, 26 Mar 2022 16:32:43 GMT

### Patches

- handle encoding of an empty tuple

## 0.4.0
Fri, 11 Mar 2022 07:38:31 GMT

### Minor changes

- implement encoding

## 0.3.1
Mon, 07 Feb 2022 15:16:41 GMT

_Version update only_

## 0.3.0
Wed, 02 Feb 2022 11:01:32 GMT

### Minor changes

- breaking: remove extra type kinds

### Patches

- fix decoding of compact structs and tuples
- fix decoding of big compact numbers

## 0.2.3
Tue, 25 Jan 2022 12:44:12 GMT

### Patches

- fix: support empty tuples as compact types

## 0.2.2
Thu, 20 Jan 2022 08:42:53 GMT

### Patches

- include src files into npm package

## 0.2.1
Tue, 18 Jan 2022 09:31:27 GMT

### Patches

- change license to GPL3

## 0.2.0
Thu, 13 Jan 2022 16:05:36 GMT

### Minor changes

- adjust Variant type definition for json decoding

## 0.1.0
Mon, 10 Jan 2022 17:09:28 GMT

### Minor changes

- breaking: move `JsonCodec` into separate package

## 0.0.1
Mon, 03 Jan 2022 16:07:32 GMT

### Patches

- set `publishConfig.access` to `public`

## 0.0.0
Mon, 03 Jan 2022 12:24:26 GMT

_Initial release_

