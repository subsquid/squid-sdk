# @subsquid/squid-sdk

Umbrella package for the Squid SDK. It bundles the SDK's data sources and utilities and exposes
them through **subpaths**, so a squid can depend on a single package:

```ts
import {EvmFallbackDataSourceBuilder} from '@subsquid/squid-sdk/evm/fallback'
import {EvmRpcDataSourceBuilder}       from '@subsquid/squid-sdk/evm/rpc'
import {FallbackDataSource}            from '@subsquid/squid-sdk/fallback'
import {PortalClient}                  from '@subsquid/squid-sdk/client/portal'
import {def}                           from '@subsquid/squid-sdk/util'
```

The root import (`@subsquid/squid-sdk`) is intentionally empty — use the subpaths.

## Where to start

| I want to… | Import |
| --- | --- |
| Build an EVM fallback data source | `import {EvmFallbackDataSourceBuilder} from '@subsquid/squid-sdk/evm/fallback'` |
| Build a single RPC EVM source | `import {EvmRpcDataSourceBuilder} from '@subsquid/squid-sdk/evm/rpc'` |
| Build a single Portal EVM source | `import {DataSourceBuilder} from '@subsquid/squid-sdk/evm'` |
| Catch all-sources-down / type a policy | `import {AllSourcesDownError, FallbackPolicy} from '@subsquid/squid-sdk/evm/fallback'` |
| Export fallback metrics onto a custom registry | `import {fallbackMetricsSink} from '@subsquid/squid-sdk/fallback'` |
| Run a processor over a source | `import {run} from '@subsquid/squid-sdk/processor'` |
| Store to a TypeORM database | `import {TypeormDatabase} from '@subsquid/squid-sdk/store/typeorm'` |

Editor autocomplete lists the subpaths: type `@subsquid/squid-sdk/` and, one level down,
`@subsquid/squid-sdk/evm/` — see [TypeScript resolution](#typescript-resolution) for how that works.

## Subpaths

| Subpath | Contents | Source |
| --- | --- | --- |
| `evm` | EVM stream types & data-request model | re-export of `@subsquid/evm-stream` |
| `evm/rpc` | RPC-backed EVM data source (`EvmRpcDataSourceBuilder`, Portal-compatible output) | **owned** (folded in) |
| `evm/fallback` | `EvmFallbackDataSourceBuilder` — the EVM binding of the fallback supervisor | **owned** (folded in) |
| `evm/objects` | augmented EVM data model | re-export of `@subsquid/evm-objects` |
| `fallback` | VM-agnostic fallback supervisor: drives the lowest-index healthy source of N | **owned** (folded in) |
| `solana` | Solana stream | re-export of `@subsquid/solana-stream` |
| `fuel` | Fuel stream | re-export of `@subsquid/fuel-stream` |
| `util` | general SDK utilities | re-export of `@subsquid/util-internal` |
| `util/data-source` | data-source interfaces | re-export of `@subsquid/util-internal-data-source` |
| `util/range` | block-range helpers | re-export of `@subsquid/util-internal-range` |
| `util/hex` | hex helpers | re-export of `@subsquid/util-internal-hex` |
| `util/json` | JSON helpers | re-export of `@subsquid/util-internal-json` |
| `util/validation` | schema validation | re-export of `@subsquid/util-internal-validation` |
| `util/processor-tools` | processor building blocks | re-export of `@subsquid/util-internal-processor-tools` |
| `util/timeout` | timeout helpers | re-export of `@subsquid/util-timeout` |
| `client/portal` | Portal client | re-export of `@subsquid/portal-client` |
| `client/rpc` | JSON-RPC client | re-export of `@subsquid/rpc-client` |
| `client/http` | HTTP client | re-export of `@subsquid/http-client` |
| `logger` | logging | re-export of `@subsquid/logger` |
| `processor` | batch-processor runner (`run`, `PrometheusServer`, `Database`) | re-export of `@subsquid/batch-processor` |
| `store/typeorm` | TypeORM storage for mappings | re-export of `@subsquid/typeorm-store` |

The `evm/rpc`, `evm/fallback`, and `fallback` subpaths are owned by this package (their standalone
packages were folded in and removed). Everything else is a re-export of a package that is still
published standalone — import it either way. `store/typeorm` re-exports `@subsquid/typeorm-store`,
which needs `typeorm` and `@subsquid/big-decimal` as peers — install them in a squid that stores to a
database.

## EVM fallback source

`EvmFallbackDataSourceBuilder` mirrors `@subsquid/evm-stream`'s `DataSourceBuilder`: define the field
selection and query **once**, list the ordered downstream sources as plain config objects, and
`build()` a `FallbackDataSource<Block<F>>` — a drop-in for a single Portal source (the processor needs
no changes). `setFields` infers the block type `F`, so downstream field access is fully typed.

```ts
import {EvmFallbackDataSourceBuilder} from '@subsquid/squid-sdk/evm/fallback'

const source = new EvmFallbackDataSourceBuilder()
    .setDownstreamSources([
        {type: 'portal', url: 'https://portal.sqd.dev/datasets/ethereum-mainnet'},
        {type: 'rpc', url: RPC_URL, network: 'ethereum-mainnet'},
    ])
    .setFields({log: {topics: true, data: true}})
    .addLog({where: {address: [CONTRACT], topic0: [TRANSFER]}, range: {from: 10_000_000}})
    .build()
```

Each source is a tagged config object. `portal` takes the same options as `DataSourceBuilder#setPortal`
(`{url, …}`); `rpc` takes a JSON-RPC endpoint plus an optional per-network preset and overrides
(`{url, network, …}`). `name` is optional — sources default to `${type}-${index}` in metrics/logs. The
shared query is applied to **every** source, so they all fetch identical data.

An `rpc` source uses its `network` preset (or explicit `rpc`/`method` overrides) to enable block
validation and pick the right trace/state-diff method. Without either — an unknown/omitted `network`
and no overrides — validation is off and dataset parity with the Portal is **not guaranteed**; the
source logs a warning in that case rather than failing silently.

To catch an all-sources-down failure or type a policy, `AllSourcesDownError` and `FallbackPolicy` are
re-exported from this subpath (also available from `@subsquid/squid-sdk/fallback`).

For a custom source, use `{type: 'custom', buildSource(fields, requests)}`: it is handed the same
shared field selection + query as the other sources and returns an `EVMDataSource`. Ignore the
arguments to wrap an already-built source — but then keeping it consistent with the others is on you.

For a single, non-fallback source use the standalone builders directly — they share the same fluent
query surface, differing only in the endpoint call:

```ts
import {DataSourceBuilder}       from '@subsquid/squid-sdk/evm'      // Portal — .setPortal(...)
import {EvmRpcDataSourceBuilder} from '@subsquid/squid-sdk/evm/rpc'  // RPC    — .setRpc(...)

const rpcSource = new EvmRpcDataSourceBuilder()
    .setRpc({url: RPC_URL, network: 'ethereum-mainnet'})
    .setFields({log: {topics: true, data: true}})
    .addLog({where: {address: [CONTRACT], topic0: [TRANSFER]}, range: {from: 10_000_000}})
    .build()
```

## Fallback metrics

When a fallback source is run through the processor (`run(src, db, handler, {prometheus})` from
`@subsquid/batch-processor`), its `sqd_fallback_*` gauges are registered on the processor's `/metrics`
**automatically** — no manual wiring. The exported series:

- `sqd_fallback_active{source}` — 1 for the active source, 0 for standbys.
- `sqd_fallback_source_health{source,state,check,reason,code}` — trinary per-source health; the
  `unhealthy` row carries the cause as `check`/`reason`/`code` labels.
- `sqd_fallback_lag_blocks`, `sqd_fallback_staleness_ms`, `sqd_fallback_chain_stalled`,
  `sqd_fallback_switches` — fallback-wide gauges.

`run()` picks these up because the built source exposes `getMetricsSink()`. To export them onto a
different registry, or under a custom prefix, the sink is also available directly:
`fallbackMetricsSink(source, prefix?)` from `@subsquid/squid-sdk/fallback` (idempotent per registry,
so adding it manually alongside the automatic registration is safe).

## Optional EVM peers

The `fallback` supervisor is VM-agnostic and pulls no EVM code. The EVM RPC source (`evm/rpc`) and
the EVM fallback binding (`evm/fallback`) need `@subsquid/evm-rpc` and `@subsquid/evm-normalization`,
which are declared as **optional peer dependencies**:

- A Portal-only or non-EVM squid does not install them and never loads the RPC stack — the EVM
  fallback binding `require`s `evm/rpc` lazily, only when an `rpc` source is actually configured.
- A squid using `evm/rpc` (directly or via an `rpc` fallback source) installs the two peers.

## TypeScript resolution

Subpaths are declared in **both** the package's `exports` map and its `typesVersions` map. This is
deliberate:

- Squids on a modern `tsconfig.json` (`moduleResolution` `node16` / `nodenext` / `bundler`) resolve
  subpath types via `exports`.
- Squids on the classic setting (`"module": "commonjs"` with no explicit `moduleResolution`, i.e.
  `node`/node10 — the default in the standard squid template) **ignore `exports`** for type
  resolution and rely on `typesVersions` instead.

Shipping both means `@subsquid/squid-sdk/<subpath>` type-checks regardless of a squid's
`moduleResolution`. At runtime Node always honors `exports`.

### Subpath autocomplete

For nested subpaths (`evm/rpc`, `util/range`, …), classic resolution only surfaces a subpath's
children in editor autocomplete when the parent is a real directory on disk — otherwise typing
`@subsquid/squid-sdk/evm/` completes to nothing. So the build emits a small **directory redirect**
per subpath: `evm/rpc/package.json` with `types`/`main` pointing back into `lib/`
(`scripts/gen-subpath-stubs.cjs`, run after `tsc`). These are generated, git-ignored, and shipped via
`files`; Node never consults them (it resolves via `exports`) — they exist only so editors can
enumerate and complete the subpaths.
