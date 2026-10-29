# EVM dump

Archives finalized EVM blocks from an RPC endpoint. The optional raw block stream
can supply block bodies from NATS JetStream while RPC supplies finalized heights,
block hashes, and fallback data.

## Raw block stream

Set both `--stream-url <urls>` and `--stream-dataset <name>` to enable stream reads.
`--stream-url` takes one NATS server or a comma separated list of the servers of one
cluster with the same scheme and credentials.
The dataset name accepts letters, digits, underscores, and hyphens. Stream reads
require Node.js 22.15 or later with built-in zstd support. The stream must already
contain messages in the supported raw block format; this tool does not publish them.

The stream verifier does not make the block access list and consensus anchor checks
yet, so the dumper refuses `--with-block-access-lists` and `--consensus-anchor-validation`
together with a stream.

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

A walk starts from a block hash obtained from RPC and goes down the parent hashes.
Each streamed block must state the hash the walk expects. With `--verify-block-hash`
its header must also hash to that value, which authenticates every header field and
so the parent hash the walk follows next. Without it the header, parent hash included,
is taken as the publisher states it, the same trust the RPC path places in its endpoint.
Leave the option off only on a chain whose header hashing is not supported; the dumper
warns at startup when it is off.

Transaction, receipt, and log verification follows the enabled `--verify-*` options; traces and
state diffs cannot be authenticated by the header. Blocks must match the requested
data components and continue the archived chain. Archive layout and output
compression are independent of the source used to obtain each block.

Each transaction, receipt and log is checked to be in order and to belong to its block,
but its content and the *set* of them are tied to the verified header only by a root.
`--verify-tx-root` covers transactions, and with it the hash of each transaction is
recomputed from the transaction itself. Receipts and logs are covered only by
`--with-receipts` together with `--verify-receipts-root`. A logs bloom holds just addresses
and topics, so `--verify-logs-bloom` leaves the data of a log open. The dumper names the
missing options at startup.

Blocks are taken from the stream in walks. A walk holds the compressed payloads of its
blocks and stops short once they reach 64 MiB, and later walks are sized from the weight
the last one has shown. Blocks are decompressed again when they are handed over, in batches
of at most 128 MiB of decompressed lines, and a bigger block goes in a batch of its own.
This bounds what the stream lane costs on any chain.
