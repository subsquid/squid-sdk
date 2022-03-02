# Change Log - @subsquid/substrate-metadata

This log was last generated on Wed, 02 Mar 2022 18:11:28 GMT and should not be manually modified.

## 0.4.0
Wed, 02 Mar 2022 18:11:28 GMT

### Minor changes

- add types for `bifrost`, `moonbeam`, `moonriver`

## 0.3.1
Mon, 21 Feb 2022 12:42:24 GMT

### Patches

- support `Range`, `RangeInclusive` in old types
- allow trailing commas in old type expression lists
- add type definitions for altair

## 0.3.0
Mon, 07 Feb 2022 15:16:41 GMT

### Minor changes

- internal: events and calls: add option to camelCase call names

## 0.2.0
Wed, 02 Feb 2022 11:01:32 GMT

### Minor changes

- normalize variant option types to `TypeKind.Option`
- breaking: remove extra type kinds

### Patches

- fix: remove spaces from VoteThreshold variant names
- fix erroneous DoNotConstruct type encounters on old recursive types
- remove checks for Compact type parameter
- old types bundle: remove `Compact` alias in `staking`

## 0.1.3
Thu, 20 Jan 2022 12:30:26 GMT

### Patches

- fix definition of GenericVote type

## 0.1.2
Thu, 20 Jan 2022 08:42:53 GMT

### Patches

- fix handling of `Result` types in pre-V14 metadata
- add support for `BTreeMap`, `BTreeSet`
- include src files into npm package

## 0.1.1
Tue, 18 Jan 2022 09:31:27 GMT

### Patches

- change license to GPL3

## 0.1.0
Thu, 13 Jan 2022 16:05:36 GMT

### Minor changes

- Add types bundle for polkadot

## 0.0.2
Mon, 10 Jan 2022 17:09:28 GMT

_Version update only_

## 0.0.1
Mon, 03 Jan 2022 16:07:32 GMT

### Patches

- set `publishConfig.access` to `public`

## 0.0.0
Mon, 03 Jan 2022 12:24:26 GMT

_Initial release_

