# @subsquid/util-internal-dump-stream

Lets a dumper built on `@subsquid/util-internal-dump-cli` take finalized block bodies
from a NATS JetStream stream of raw blocks instead of fetching them from RPC.
RPC still supplies the finalized head, the block hashes that anchor each read, and
every block the stream can't give.

The stream is not trusted. A block is taken from it only when it passes the chain's
own checks against a hash that came from RPC, and only down the parent links from
that hash. Everything else is fetched from RPC.

This package holds the chain independent part: the NATS connection, the message
checks, the walk down parent links, the RPC fallback, the CLI options and the metrics.
A dumper adds what only its chain knows.

## Stream layout

- Stream `raw-<dataset>`, with direct get allowed.
- One subject per block: `raw.<dataset>.<number>.<hash>`. The last message of a subject is read.
- Headers:
  - `schema`: names the payload format, e.g. `evm-raw-line-zstd/1`
  - `components`: comma separated names of what the block holds and which checks the publisher has made
  - `hash`, `parent_hash`, `parent_number`: where the block is in the chain
  - `payload_crc32`: CRC-32 of the payload, as 8 hex digits
- Payload: the block as a zstd-compressed JSON line, the same line the dumper writes to the archive.

## What a chain provides

- `LineFormat<B>`
  - `schema`: the value of the `schema` header to take
  - `rule`: the `components` the dumper accepts, see `ComponentsRule`. It names only the
    parts of a block and the ways to fetch them that change its shape. Names of checks,
    `v-*` for a check the publisher has made and `no-*` for one it has skipped, are taken
    as they are, because the dumper repeats every check it needs. Any other unknown name
    rejects the block.
  - `isHash`: accepts only a well formed hash. A parent hash goes into the next subject.
  - `normalizeHash` (optional): brings RPC and archive hashes to the form of the stream, e.g. lower case for EVM
  - `getRef`: the number, hash and parent hash a decoded block says it has
- `LineVerifier<B>`: checks a decoded block against the trusted hash. The stated hash and
  parent hash are matched before it runs, but only a hash it recomputes from the block
  authenticates the rest: without that the stream can give anything under a real hash,
  and the parent hash the walk follows next is the publisher's word. Skip the recompute
  only where the dumper takes headers on trust anyway, as `@subsquid/evm-dump` does
  without `--verify-block-hash`. Every other field the archive keeps, such as a
  transaction hash, must be recomputed or tied to that hash as well.
- Heights must be consecutive: the parent of block `n` is block `n - 1`.
- `RpcSource<B>`: the finalized head, the hash of a finalized block, and finalized blocks of a range.

## Wiring

```ts
import {
    addStreamOptions,
    connectNatsStream,
    createStreamMetrics,
    getStreamSettings,
    RawStreamSource,
    type StreamOptions,
} from '@subsquid/util-internal-dump-stream'

interface Options extends DumperOptions, StreamOptions {}

class MyDumper extends Dumper<Block, Options> {
    protected setUpProgram(program: Command): void {
        addStreamOptions(program, 'A block is taken only when ...')
    }

    protected validateOptions(): void {
        this.rawStream()
    }

    @def
    private rawStream(): RawStreamSource<Block> | undefined {
        let stream = getStreamSettings(this.options())
        if (stream == null) return undefined

        return new RawStreamSource({
            rpc: myRpcSource,
            connect: () => connectNatsStream({url: stream.url, dataset: stream.dataset, name: 'my-dump'}),
            format: myLineFormat,
            getVerifier: async () => myVerifier,
            headPollInterval: 1000,
            waitTimeout: stream.waitTimeout,
            metrics: createStreamMetrics(this.prometheus()),
            log: this.log().child('stream'),
        })
    }

    protected async *getBlocks(range: Range, prevHash?: string): AsyncIterable<Block[]> {
        let stream = this.rawStream()
        if (stream) {
            yield* stream.getBlocks(range, prevHash)
            return
        }

        // fetch from RPC as before
    }
}
```

`@subsquid/evm-dump` is the reference user.

## Memory

A walk holds the compressed payloads of its blocks and stops short once they fill
`payloadBudget` (64 MiB). It keeps no block parsed. Blocks are decoded again when they
are handed over, one batch at a time, and a batch holds at most `batchSize` blocks (10)
and `batchBudget` bytes of decompressed lines (128 MiB). A bigger block goes in a batch
of its own.

## Options

- `--stream-url <urls>`: NATS server, `nats://` or `tls://`, or a comma separated list of the
  servers of one cluster, e.g. `nats://a:4222,nats://b:4222,nats://c:4222`. All of them must
  share the scheme and the credentials. The client connects to one of them in random order and
  tries the next when it does not answer, so a stream stays available while one server is down.
  A user name without a password is sent as a token.
- `--stream-dataset <name>`: letters, digits, `_` and `-`
- `--stream-wait-timeout <ms>`: how long to wait for the finalized head to be published
  before RPC fetches it. The default is 10 minutes, `0` turns waiting off.

Both `--stream-url` and `--stream-dataset` must be set to turn the stream on.
The stream needs Node.js 22.15 or later for its built-in zstd.

## Metrics

- `sqd_dump_blocks_total{source="stream"|"rpc"}`: blocks received from each source
- `sqd_dump_stream_miss_total{reason}`: times blocks went to RPC, by the reason the stream was not used
