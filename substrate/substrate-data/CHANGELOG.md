# Change Log - @subsquid/substrate-data

This log was last generated on Thu, 19 Oct 2023 08:58:05 GMT and should not be manually modified.

## 3.0.1
Thu, 19 Oct 2023 08:58:05 GMT

### Patches

- pass RPC client to `Runtime` instances

## 3.0.0
Thu, 28 Sep 2023 20:58:19 GMT

### Breaking changes

- change bit sequence JS representation in decoded data

### Minor changes

- implement `Multisig.approve_as_multi` call traversal

### Patches

- fix `Sudo.sudo_as` call parsing
- fix handling of `TransactionPayment.TransactionFeePaid` in Karura/Acala
- adapt to `sts.tuple()` signature change
- update dependencies
- compile with TypeScript 5

## 2.0.5
Fri, 15 Sep 2023 11:35:40 GMT

### Patches

- don't panic when `Session.Validators` storage doesn't exist

## 2.0.4
Thu, 14 Sep 2023 12:05:35 GMT

### Patches

- fix `Proxy.proxy` call expansion

## 2.0.3
Wed, 13 Sep 2023 22:16:51 GMT

_Version update only_

## 2.0.2
Thu, 07 Sep 2023 20:03:29 GMT

### Patches

- skip batch call handling for polymesh network

## 2.0.1
Thu, 07 Sep 2023 18:37:04 GMT

### Patches

- unwrap old batch calls

## 2.0.0
Tue, 05 Sep 2023 20:32:34 GMT

### Breaking changes

- migrate to a new scale type system

## 1.2.1
Thu, 10 Aug 2023 11:43:45 GMT

### Patches

- remove extra `0x` on storage key encoding

## 1.2.0
Fri, 04 Aug 2023 07:25:15 GMT

### Minor changes

- extract and expose `RuntimeTracker`
- re-export `Rpc` from raw package

## 1.1.0
Wed, 02 Aug 2023 22:59:19 GMT

### Minor changes

- support indexing of special events and calls

## 1.0.0
Tue, 01 Aug 2023 16:40:12 GMT

### Breaking changes

- migrate to per block runtime tracking

### Patches

- annotate block parsing errors with `.blockHeight` and `.blockHash`
- fix extrinsic fee calculation

## 0.0.1
Thu, 27 Jul 2023 13:21:04 GMT

### Patches

- fix block validator parsing

## 0.0.0
Wed, 19 Jul 2023 16:48:14 GMT

_Initial release_

