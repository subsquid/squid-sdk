# Change Log - @subsquid/evm-typegen

This log was last generated on Sun, 27 Nov 2022 18:43:31 GMT and should not be manually modified.

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

