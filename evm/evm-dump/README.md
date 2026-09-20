# EVM dump

Archives finalized EVM blocks from an RPC endpoint. The optional raw block stream
can supply block bodies from NATS JetStream while RPC supplies finalized heights,
block hashes, and fallback data.

## Raw block stream

Set both `--stream-url <url>` and `--stream-dataset <name>` to enable stream reads.
The dataset name accepts letters, digits, underscores, and hyphens. Stream reads
require Node.js 22.15 or later with built-in zstd support. The stream must already
contain messages in the supported raw block format; this tool does not publish them.

If the selected finalized head is missing from the stream, the dumper retries that
same block number and hash once per second before falling back to RPC. Advancing
RPC heads do not change the block being awaited or restart the waiting budget.
This allows a publisher with a small delay to supply the block without requiring
RPC to fetch its body.

`--stream-wait-timeout <ms>` controls the retry budget and defaults to `600000` (10 minutes).
Set it to `0` to disable publication waiting. Individual stream requests retain
their own transport timeout. Historical misses below the selected finalized head,
invalid messages, and transport failures fall back without publication waiting.

After falling back, the dumper periodically checks the stream when RPC catches up.
These recovery checks also wait for the same selected block within the configured
budget, so publication lag does not continually move the recovery target. Blocks RPC
has already fetched are handed over before such a check starts, so the waiting budget
never delays data that is in hand.

Streamed headers are always checked against hashes obtained from RPC. Transaction,
receipt, and log verification follows the enabled `--verify-*` options; traces and
state diffs cannot be authenticated by the header. Blocks must match the requested
data components and continue the archived chain. Archive layout and output
compression are independent of the source used to obtain each block.

Each transaction, receipt and log is checked to be in order and to belong to its block,
but the *set* of them is tied to the verified header only by a root or a bloom. Without
`--verify-tx-root`, `--verify-receipts-root` and `--verify-logs-bloom` a stream that drops
or adds a tail goes unnoticed, so the dumper names the missing options at startup.

Blocks are taken from the stream in walks that are held whole in memory. A walk stops
short once the payloads it holds reach 64 MiB, and later walks are sized from the weight
the last one has shown, which bounds what the stream lane costs on any chain.
