# Change Log - @subsquid/substrate-metadata

This log was last generated on Fri, 08 Apr 2022 10:15:29 GMT and should not be manually modified.

## 0.8.1
Fri, 08 Apr 2022 10:15:29 GMT

### Patches

- fix regression with call indexes in old types

## 0.8.0
Sat, 26 Mar 2022 16:32:43 GMT

### Minor changes

- add type bundles for parachains

### Patches

- define old type for `OriginCaller`

## 0.7.0
Mon, 14 Mar 2022 18:47:21 GMT

### Minor changes

- support explicitly indexed enums in old type definitions

## 0.6.0
Fri, 11 Mar 2022 07:38:31 GMT

### Minor changes

- storage description

### Patches

- fixes for altair types bundle
- handle generic `Int<?>` types in old bundles

## 0.5.0
Fri, 04 Mar 2022 14:30:51 GMT

### Minor changes

- exclude qualified name from event/call type hash

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

