# Change Log - @subsquid/evm-dump

This log was last generated on Tue, 10 Nov 2026 07:49:45 GMT and should not be manually modified.

## 0.3.0
Tue, 10 Nov 2026 07:49:45 GMT

### Minor changes

- `--derive-total-difficulty`: write totalDifficulty as the parent's plus the block's difficulty, from the archive's last block (or `--parent-total-difficulty`)
- Add `--with-block-access-lists` and `--verify-block-access-list-hash`; Amsterdam blocks pass block-hash verification
- add `--stream-url` and `--stream-dataset` options to read block bodies from a JetStream stream of raw blocks, falling back to RPC. The stream is not trusted: a block is taken only when it states the hash known from RPC, down the parent links from the finalized head, and it passes every `--verify-*` check that is on. With `--verify-block-hash` its header must also hash to that hash; without it, as on the RPC path, the header is taken as stated, so a chain whose header hashing is not supported reads from the stream too. Transactions are tied to the header only by `--verify-tx-root`, which also checks each transaction hash, receipts and logs only by `--with-receipts` with `--verify-receipts-root`, call traces and state diffs can not be tied to it at all, the same as with RPC. Requires Node.js 22.15 or later for its built-in zstd
- Validate debug call frames and state diffs against receipt status, gasUsed and transaction fees (--consensus-anchor-validation, --consensus-anchor-rules)
- the stream verifier makes the consensus anchor checks, so `--consensus-anchor-validation` works with `--stream-url`: under `reject` a violating streamed block is fetched from RPC, under `observe` it is taken and logged

### Patches

- hand over the blocks RPC has already fetched before asking the stream for them, so the publication waiting budget no longer delays data that is in hand. Bound the memory of a stream walk with a payload budget, size later walks from the weight of the last one, and bound each handed over batch by its decompressed size. Warn at startup about the parts of a streamed block that no `--verify-*` option ties to its header, and report a bad `--stream-*` combination before the dump starts
- Wait up to 10 minutes for delayed publication of a selected finalized block before falling back to RPC, including recovery probes. Add --stream-wait-timeout to configure or disable the waiting budget.

## 0.2.0
Mon, 14 Sep 2026 10:05:38 GMT

### Minor changes

- Add `--head-poll-interval`, defaulting to 1000ms, so a caught-up dumper stops re-asking for the chain head ten times a second.
- add --verify-ext-data-hash flag: check blockExtraData against the extDataHash header commitment

## 0.1.0
Thu, 30 Jul 2026 15:44:58 GMT

### Minor changes

- add a call-frame validation mode option to the EVM archiver CLI

## 0.0.5
Wed, 15 Jul 2026 22:15:56 GMT

_Version update only_

## 0.0.4
Wed, 15 Jul 2026 01:21:06 GMT

_Version update only_

## 0.0.3
Tue, 14 Jul 2026 13:09:33 GMT

_Version update only_

## 0.0.2
Mon, 01 Jun 2026 19:32:22 GMT

### Patches

- Adding support for debug_traceBlockByNumber

## 0.0.1
Mon, 11 May 2026 05:34:26 GMT

### Patches

- init EVM dump CLI

