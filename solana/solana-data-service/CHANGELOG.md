# Change Log - @subsquid/solana-data-service

This log was last generated on Tue, 10 Nov 2026 07:49:45 GMT and should not be manually modified.

## 0.0.8
Tue, 10 Nov 2026 07:49:45 GMT

### Patches

- Keep vote-account management transactions (Withdraw, Authorize, UpdateCommission) when vote transactions are excluded

## 0.0.7
Wed, 08 Jul 2026 22:11:26 GMT

### Patches

- Add `incActiveWorkers`/`decActiveWorkers` accounting (already present in the EVM/TRON data services) so `belowQuery` worker threads are released correctly.

## 0.0.6
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init Solana data service

