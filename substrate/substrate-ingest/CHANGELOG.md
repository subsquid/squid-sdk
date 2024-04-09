# Change Log - @subsquid/substrate-ingest

This log was last generated on Tue, 09 Apr 2024 17:45:37 GMT and should not be manually modified.

## 3.6.1
Tue, 09 Apr 2024 17:45:37 GMT

_Version update only_

## 3.6.0
Sun, 17 Mar 2024 23:20:20 GMT

### Minor changes

- use new ingest CLI framework

## 3.5.1
Thu, 29 Feb 2024 15:27:11 GMT

_Version update only_

## 3.5.0
Fri, 01 Dec 2023 16:55:51 GMT

### Minor changes

- upgrade `@subsquid/*` dependencies

### Patches

- update dependencies

## 3.4.5
Thu, 19 Oct 2023 08:58:05 GMT

_Version update only_

## 3.4.4
Wed, 11 Oct 2023 19:13:41 GMT

### Patches

- fix service response completion

## 3.4.3
Thu, 28 Sep 2023 20:58:19 GMT

### Patches

- fix `Sudo.sudo_as` call parsing
- fix handling of `TransactionPayment.TransactionFeePaid` in Karura/Acala
- update dependencies

## 3.4.2
Wed, 13 Sep 2023 22:16:51 GMT

_Version update only_

## 3.4.1
Tue, 12 Sep 2023 08:42:04 GMT

_Version update only_

## 3.4.0
Tue, 05 Sep 2023 20:32:34 GMT

### Minor changes

- migrate to new substrate runtime packages

## 3.3.0
Wed, 23 Aug 2023 14:37:23 GMT

### Minor changes

- add `--endpoint-max-batch-call-size` cli option

## 3.2.0
Wed, 02 Aug 2023 22:59:19 GMT

### Minor changes

- support indexing of special events and calls

## 3.1.1
Tue, 01 Aug 2023 16:40:12 GMT

_Version update only_

## 3.1.0
Thu, 27 Jul 2023 13:21:04 GMT

### Minor changes

- introduce HTTP service mode

## 3.0.0
Wed, 19 Jul 2023 16:48:14 GMT

### Breaking changes

- actually introduce `ArrowSquid`

## 2.1.0
Sat, 10 Jun 2023 15:11:08 GMT

### Minor changes

- migrate to TypeScript 5 and update other dependencies

## 2.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- Introduce ArrowSquid

## 1.5.2
Sat, 25 Feb 2023 19:16:49 GMT

_Version update only_

## 1.5.1
Sun, 12 Feb 2023 12:16:19 GMT

_Version update only_

## 1.5.0
Thu, 09 Feb 2023 15:10:00 GMT

### Minor changes

- support `http(s)` RPC endpoints

## 1.4.1
Wed, 25 Jan 2023 18:43:43 GMT

### Patches

- handle `MultisigApproval` case in `as_multi` call unwrapping procedure

## 1.4.0
Wed, 18 Jan 2023 11:05:01 GMT

### Minor changes

- unwrap `Multisig.as_multi_threshold_1` and recent versions of `Multisig.as_multi` calls

## 1.3.4
Sun, 27 Nov 2022 18:43:31 GMT

_Version update only_

## 1.3.3
Sun, 06 Nov 2022 18:24:20 GMT

_Version update only_

## 1.3.2
Fri, 28 Oct 2022 12:04:58 GMT

_Version update only_

## 1.3.1
Sat, 15 Oct 2022 11:43:02 GMT

_Version update only_

## 1.3.0
Fri, 14 Oct 2022 13:59:14 GMT

### Minor changes

- support polkadotjs types bundles

## 1.2.2
Fri, 30 Sep 2022 14:01:22 GMT

### Patches

- fix naming collision for EVM.ExecutedFailed

## 1.2.1
Wed, 28 Sep 2022 07:59:35 GMT

### Patches

- fix naming collision between Acala EVM and frontier

## 1.2.0
Thu, 15 Sep 2022 20:54:52 GMT

### Minor changes

- Index `EVM.Executed` and `EVM.ExecutedFailed` events from Acala network
- save missing metadata at the start of processing (resolves #78)

### Patches

- handle `ChargeTransactionPayment` signed extension from Nikau network

## 1.1.1
Thu, 01 Sep 2022 09:27:14 GMT

### Patches

- fix fees calculation for acala network

## 1.1.0
Mon, 22 Aug 2022 15:27:06 GMT

### Minor changes

- add specialized index for `Ethereum.transact` calls

## 1.0.0
Wed, 17 Aug 2022 17:33:52 GMT

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

