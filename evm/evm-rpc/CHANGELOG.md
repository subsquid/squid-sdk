# Change Log - @subsquid/evm-rpc

This log was last generated on Wed, 15 Jul 2026 22:15:56 GMT and should not be manually modified.

## 0.0.5
Wed, 15 Jul 2026 22:15:56 GMT

### Patches

- fix(data-source): decouple finalization from head ingestion — the finalizer no longer emits the finalized head as its own empty batch (which shared the output queue with head blocks and could stall ingestion). The latest finalized head is now attached to the next head batch instead; deferring it is safe because finality lags the head and the consumer max-guards it. Part of NET-408.

## 0.0.4
Wed, 15 Jul 2026 01:21:06 GMT

### Patches

- trace_block: pass block.number instead of block.hash, and fail early if traces are missing for any transaction

## 0.0.3
Tue, 14 Jul 2026 13:09:33 GMT

### Patches

- Release to npm via GitHub Actions trusted publishing (OIDC)
- Add pre-Byzantium post-state root to receipts verification (allows verifying receipts for Ethereum mainnet blocks 0 - 4,369,999)

## 0.0.2
Mon, 01 Jun 2026 19:32:22 GMT

### Patches

- The log ordering issue fix + support for debug_traceBlockByNumber

## 0.0.1
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init EVM RPC data source

