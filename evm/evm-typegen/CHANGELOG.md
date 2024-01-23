# Change Log - @subsquid/evm-typegen

This log was last generated on Tue, 23 Jan 2024 16:47:41 GMT and should not be manually modified.

## 3.3.0
Tue, 23 Jan 2024 16:47:41 GMT

### Minor changes

- add `.is()` methods to support classes

## 3.2.4
Fri, 01 Dec 2023 16:55:51 GMT

### Patches

- update dependencies

## 3.2.3
Thu, 28 Sep 2023 20:58:19 GMT

### Patches

- update dependencies
- compile with TypeScript 5

## 3.2.2
Thu, 27 Jul 2023 13:21:04 GMT

### Patches

- bump `ethers` peer to `^6.6.5`

## 3.2.1
Wed, 19 Jul 2023 16:48:14 GMT

### Patches

- upgrade `commander` from `10.0.1` to `11.0.0` 

## 3.2.0
Sun, 11 Jun 2023 15:49:45 GMT

### Minor changes

- downgrade `TypeScript` to `4.9.5`

## 3.1.0
Sat, 10 Jun 2023 15:11:08 GMT

### Minor changes

- migrate to TypeScript 5 and update other dependencies

## 3.0.0
Mon, 01 May 2023 18:57:46 GMT

### Breaking changes

- migrate to ethers-v6

## 2.1.1
Sat, 25 Feb 2023 19:16:49 GMT

_Version update only_

## 2.1.0
Sun, 19 Feb 2023 09:15:04 GMT

### Minor changes

- add `--etherscan-api-key` option
- add exponential backoff for etherscan API rate limit errors

## 2.0.4
Sun, 12 Feb 2023 12:16:19 GMT

_Version update only_

## 2.0.3
Thu, 09 Feb 2023 15:10:00 GMT

### Patches

- use `@subsquid/util-internal-http-client` for HTTP requests

## 2.0.2
Tue, 06 Dec 2022 12:55:16 GMT

### Patches

- use `_` as name for nameless tuple items

## 2.0.1
Wed, 30 Nov 2022 19:36:06 GMT

### Patches

- fix startup crash

## 2.0.0
Sun, 27 Nov 2022 18:43:31 GMT

### Breaking changes

- new CLI interface and layout of generated files
- use non-signature name to refer to non-overloaded event or function

### Minor changes

- add `--multicall` option to generate specialized facade for MakerDAO multicall contract
- support fetching ABIs from etherscan or arbitrary http url

### Patches

- fix: `bytes[]` was typed as `bytes`

## 1.3.1
Fri, 28 Oct 2022 12:04:58 GMT

_Version update only_

## 1.3.0
Mon, 22 Aug 2022 15:27:06 GMT

### Minor changes

- Generate code for function calls decoding

## 1.2.0
Wed, 17 Aug 2022 17:33:52 GMT

### Minor changes

- generate typed `eth_call` facades

## 1.1.0
Tue, 19 Jul 2022 03:09:10 GMT

### Minor changes

- Introduce type-safe RPC client for EVM contracts

## 1.0.2
Wed, 06 Jul 2022 09:25:54 GMT

_Version update only_

## 1.0.1
Fri, 24 Jun 2022 22:07:05 GMT

### Patches

- upgrade dependencies

## 1.0.0
Sun, 19 Jun 2022 21:26:31 GMT

### Breaking changes

- Introduce FireSquid

## 0.1.0
Fri, 03 Jun 2022 21:02:03 GMT

### Minor changes

- handle array types specified as x[]
- change event name generation scheme as a temp workaround 

## 0.0.1
Wed, 20 Apr 2022 22:55:27 GMT

_Initial release_

