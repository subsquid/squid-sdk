# Change Log - @subsquid/substrate-ingest

This log was last generated on Wed, 17 Aug 2022 17:07:45 GMT and should not be manually modified.

## 1.0.0
Wed, 17 Aug 2022 17:07:45 GMT

### Breaking changes

- index `block.state_root`, `block.extrinsics_root`
- postgres sink schema changes

### Minor changes

- extract fees from `TransactionPayment.TransactionFeePaid` when possible

### Patches

- always decode big compacts (`Compact<Uxx>` where `xx > 32`) as `bigint`
- adapt for new `EVM.Log` event arguments

## 0.3.1
Thu, 04 Aug 2022 06:15:02 GMT

### Patches

- fix shebang in executable

## 0.3.0
Thu, 04 Aug 2022 06:00:53 GMT

### Minor changes

- Omit non-executed extrinsics from Mangata chain

### Patches

- throw correct object on storage error

## 0.2.0
Wed, 20 Jul 2022 13:59:43 GMT

### Minor changes

- store gear program_id in the event table

## 0.1.3
Tue, 19 Jul 2022 03:09:10 GMT

### Patches

- fix handling of `Utility.force_batch` call (were crashing when processing batches with failed items)

## 0.1.2
Tue, 12 Jul 2022 17:07:20 GMT

### Patches

- fix boundary check in event parsing

## 0.1.1
Thu, 07 Jul 2022 15:00:50 GMT

### Patches

- move timeout code into separate package

## 0.1.0
Wed, 06 Jul 2022 09:25:54 GMT

### Minor changes

- save EVM contract address in call table

### Patches

- don't crush on empty list of validators

## 0.0.6
Fri, 24 Jun 2022 22:07:05 GMT

### Patches

- upgrade dependencies

## 0.0.5
Wed, 22 Jun 2022 00:49:09 GMT

### Patches

- fix origin of sudo_as inside call for AccountId case, this time for real :)

## 0.0.4
Mon, 20 Jun 2022 16:20:18 GMT

### Patches

- fix origin of `Sudo.sudo_as` call

## 0.0.3
Sun, 19 Jun 2022 22:37:34 GMT

### Patches

- fix access config in `package.json`

## 0.0.2
Sun, 19 Jun 2022 21:47:17 GMT

_Initial release_

