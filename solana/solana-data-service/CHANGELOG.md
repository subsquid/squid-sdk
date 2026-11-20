# Change Log - @subsquid/solana-data-service

This log was last generated on Fri, 20 Nov 2026 14:01:48 GMT and should not be manually modified.

## 0.0.9
Fri, 20 Nov 2026 14:01:48 GMT

### Patches

- Export `sqd_chain_rpc_retried_errors_total` for the RPC clients of its worker threads, including closed backfill workers

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

