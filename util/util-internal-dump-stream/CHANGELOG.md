# Change Log - @subsquid/util-internal-dump-stream

This log was last generated on Tue, 10 Nov 2026 07:49:45 GMT and should not be manually modified.

## 0.1.0
Tue, 10 Nov 2026 07:49:45 GMT

### Minor changes

- chain independent reader of raw block streams for dumpers, extracted from `@subsquid/evm-dump`: NATS JetStream direct reads from one server or a list of the servers of a cluster, message checks, parent link walks with RPC fallback, `--stream-*` options and stream metrics. A chain supplies its line format, block verifier and RPC source

