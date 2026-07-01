# @subsquid/evm-fallback-stream

A meta data source that drives an ordered list of EVM sources (Portal and/or RPC) behind one
`DataSource` interface, failing over and switching back as their health changes. Drop-in for a
single `EVMDataSource` — the processor needs no changes.

## Usage

```typescript
import {createEvmFallbackSource} from '@subsquid/evm-fallback-stream'

const source = createEvmFallbackSource({
    fields,
    requests,
    sources: [
        {type: 'portal', source: portalSource},
        {type: 'rpc', rpc},
    ],
})
```

The generic supervisor (`FallbackDataSource`) works over any `DataSource<B>` and pulls in no EVM
code. The EVM glue (`createEvmFallbackSource`) is what binds it to `@subsquid/evm-stream` /
`@subsquid/evm-rpc-stream` / `@subsquid/evm-rpc`.

## Optional peer dependencies

`@subsquid/evm-stream`, `@subsquid/evm-rpc-stream` and `@subsquid/evm-rpc` are declared as
**optional** peers: a Portal-only fallback never needs the RPC stack, so they are not pulled in by
default. An `rpc` source loads `@subsquid/evm-rpc-stream` lazily (a `require` reached only on the
RPC branch); if the peers are missing it fails with an actionable message instead of an
import-time crash.

Because the EVM glue's *types* reference these peers, the package's `.d.ts` does too. This is a
type-checking-only concern (it never affects runtime — the type imports are elided and the RPC
`require` is lazy), and it is fully covered by **`skipLibCheck: true`**, which is the TypeScript
default we use across this repo and ship in the project templates. Concretely:

- **Type-checking** (`tsc`, the IDE, `ts-node` in checking mode): with `skipLibCheck: true` (the
  norm) there is nothing to do. With `skipLibCheck: false` *and* the optional peers not installed,
  `tsc` reports `TS2307` for the peer modules even if you only use the generic `FallbackDataSource`
  — install the peers (or keep `skipLibCheck` on) in that configuration.
- **Running** (`node` on compiled output, `tsx`, `bun`, `ts-node --transpile-only`): unaffected.
  Transpile-only runners never type-check, and the generic path needs none of the peers at runtime.
