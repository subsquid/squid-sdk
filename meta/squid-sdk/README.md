# @subsquid/squid-sdk

Umbrella package for the Squid SDK. It bundles the SDK's data sources and utilities and exposes
them through **subpaths**, so a squid can depend on a single package:

```ts
import {EvmFallbackDataSourceBuilder} from '@subsquid/squid-sdk/evm/fallback'
import {EvmRpcStreamDataSource}       from '@subsquid/squid-sdk/evm/rpc'
import {FallbackDataSource}           from '@subsquid/squid-sdk/fallback'
import {PortalClient}                 from '@subsquid/squid-sdk/client/portal'
import {def}                          from '@subsquid/squid-sdk/util'
```

The root import (`@subsquid/squid-sdk`) is intentionally empty — use the subpaths.

## Subpaths

| Subpath | Contents | Source |
| --- | --- | --- |
| `evm` | EVM stream types & data-request model | re-export of `@subsquid/evm-stream` |
| `evm/rpc` | RPC-backed EVM data source (Portal-compatible output) | **owned** (folded in) |
| `evm/fallback` | `EvmFallbackDataSourceBuilder` (+ `EvmPortalDataSourceBuilder` / `EvmRpcDataSourceBuilder`) — the EVM binding of the fallback supervisor | **owned** (folded in) |
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

The `evm/rpc`, `evm/fallback`, and `fallback` subpaths are owned by this package (their standalone
packages were folded in and removed). Everything else is a re-export of a package that is still
published standalone — import it either way.

## EVM fallback source

`EvmFallbackDataSourceBuilder` mirrors `@subsquid/evm-stream`'s `DataSourceBuilder`: define the field
selection and query **once**, list the ordered downstream sources (Portal and/or RPC), and `build()`
a `FallbackDataSource<Block<F>>` — a drop-in for a single Portal source (the processor needs no
changes). `setFields` infers the block type `F`, so downstream field access is fully typed.

```ts
import {
    EvmFallbackDataSourceBuilder,
    EvmPortalDataSourceBuilder,
    EvmRpcDataSourceBuilder,
} from '@subsquid/squid-sdk/evm/fallback'

const source = new EvmFallbackDataSourceBuilder()
    .setDownstreamSources([
        new EvmPortalDataSourceBuilder().setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet'),
        new EvmRpcDataSourceBuilder().setRpc({url: RPC_URL, network: 'ethereum-mainnet'}),
    ])
    .setFields({log: {topics: true, data: true}})
    .addLog({where: {address: [CONTRACT], topic0: [TRANSFER]}, range: {from: 10_000_000}})
    .build()
```

### Standalone sources

`EvmPortalDataSourceBuilder` and `EvmRpcDataSourceBuilder` are full data-source builders in their own
right — the same fluent `setFields`/`addLog`/… surface as `DataSourceBuilder`. Call `.build()` on one
directly for a single Portal or RPC source, no fallback involved:

```ts
const rpcSource = new EvmRpcDataSourceBuilder()
    .setRpc({url: RPC_URL, network: 'ethereum-mainnet'})
    .setFields({log: {topics: true, data: true}})
    .addLog({where: {address: [CONTRACT], topic0: [TRANSFER]}, range: {from: 10_000_000}})
    .build() // an EVMDataSource<F>, exactly like DataSourceBuilder.build()
```

When you drop the **same** builder into a fallback, give it connection config only (`setPortal`/`setRpc`
/`setName`) and define the shared query once on the fallback — it is injected into every source so they
all fetch identical data. A source that carries **both** its own query and is placed in a fallback throws
at `build()` time (the query must live in exactly one place).

To drive an arbitrary pre-built `EVMDataSource` (e.g. a custom source), implement the
`EvmDownstreamSourceBuilder` interface — its `buildSource(fields, requests)` returns your source.

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
