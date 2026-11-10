# Change Log - @subsquid/evm-rpc

This log was last generated on Tue, 10 Nov 2026 07:49:45 GMT and should not be manually modified.

## 0.3.0
Tue, 10 Nov 2026 07:49:45 GMT

### Minor changes

- Verify Amsterdam headers (blockAccessListHash, slotNumber) and optionally fetch and verify EIP-7928 block access lists; a block that stays invalid on the finalized polling path now fails the stream instead of stalling it
- export `ChainUtils` and the block checks of `Rpc` (`checkBlockHeader()`, `checkBlockLogs()`, `checkBlockReceipts()`, `checkStoredDebugFrame()`), make `Rpc.getChainUtils()` public. Add `ChainUtils.getRootTransactions()` and `ChainUtils.calculateTransactionHash()`
- Validate debug call frames and state diffs against receipt status, gasUsed and transaction fees (--consensus-anchor-validation, --consensus-anchor-rules)

### Patches

- Validate transaction nonce as a wide quantity so Tempo 0x76 uint64 nonces no longer crash the dumper
- consensus anchors: the `gas` rule skips a zero-priced transaction whose receipt reports no gas (HyperEVM HyperCore system transactions)
- disable cronos specific logic
- export `checkConsensusAnchors` and the system-address balance helpers, for checks of blocks that did not come through `Rpc`
- accept the empty call frame Scroll returns for an L1 message that fails before execution, rejecting empty frames everywhere else with a clear error; verify the transactions root of blocks with Scroll L1 messages
- Classify retried errors as rate_limit, transient, internal or no_result for metrics
- Retry transient provider and proxy errors: rate limits under code -32429, error text or null in place of a result, and upstream-unavailable or block-not-yet-available messages
- recover selfdestruct call frames misreported by revm-based tracers with an opcode-level trace, and reject the block when they cannot be recovered
- Retry transaction pre-check failures (insufficient funds, nonce too low or high, intrinsic gas too low) returned while tracing a mined block, under any code or proxy cause
- Accept a nonce above 2^53 in Tempo AA and Frontier EIP-7702 authorizations

## 0.2.0
Mon, 14 Sep 2026 10:05:38 GMT

### Minor changes

- Make the head poll interval configurable through `EvmRpcDataSourceOptions.headPollInterval`. Defaults to the previous hard-coded 100ms.
- expose Avalanche block header fields on GetBlock, verify block hashes and the extDataHash commitment

### Patches

- fall back to per-transaction debug tracing and receipts when a block response is too large

## 0.1.0
Thu, 30 Jul 2026 15:44:58 GMT

### Minor changes

- validate debug call-frame mapper safety and add off, observe, and reject modes for semantic consistency checks

### Patches

- encode Stable 0x3f transaction nonceKey as a quantity (uint) instead of a byte string

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

