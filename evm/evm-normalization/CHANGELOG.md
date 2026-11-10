# Change Log - @subsquid/evm-normalization

This log was last generated on Tue, 10 Nov 2026 07:49:45 GMT and should not be manually modified.

## 0.2.0
Tue, 10 Nov 2026 07:49:45 GMT

### Minor changes

- Carry the EIP-7928 block access list in raw blocks as `blockAccessList_`

### Patches

- take `yParity` of an EIP-2930, EIP-1559, EIP-4844 or EIP-7702 transaction from `v` when the node leaves it out
- Write a transaction or Tempo AA authorization nonce above 2^53 as an exact JSON number instead of failing on it
- skip structurally empty debug call frames returned by Scroll nodes for failed L1MessageTx (type 126) transactions instead of aborting normalization (see https://github.com/scroll-tech/go-ethereum/issues/1170)

## 0.1.0
Mon, 14 Sep 2026 10:05:38 GMT

### Minor changes

- expose Avalanche block header fields (blockExtraData, extDataHash, minDelayExcess, timestampMilliseconds, targetExponent, minPriceExponent, settled*) on the normalized block header

## 0.0.6
Thu, 30 Jul 2026 15:44:58 GMT

### Patches

- include transaction and trace-address context in debug call-frame mapping errors

## 0.0.5
Wed, 15 Jul 2026 22:15:56 GMT

_Version update only_

## 0.0.4
Wed, 15 Jul 2026 01:21:06 GMT

_Version update only_

## 0.0.3
Tue, 14 Jul 2026 13:09:33 GMT

### Patches

- Release to npm via GitHub Actions trusted publishing (OIDC)

## 0.0.2
Mon, 01 Jun 2026 19:32:22 GMT

_Version update only_

## 0.0.1
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init EVM normalization pipeline

