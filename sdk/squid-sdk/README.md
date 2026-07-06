# @subsquid/squid-sdk

Umbrella package for the Squid SDK. It bundles the SDK's data sources and utilities and exposes
them through **subpaths**, so a squid can depend on a single package:

```ts
import {createEvmFallbackSource} from '@subsquid/squid-sdk/evm-fallback-stream'
import {EvmRpcStreamDataSource} from '@subsquid/squid-sdk/evm-rpc-stream'
import {PortalClient}          from '@subsquid/squid-sdk/portal-client'
import {def}                   from '@subsquid/squid-sdk/util-internal'
```

The root import (`@subsquid/squid-sdk`) is intentionally empty — use the subpaths.

## Subpaths

Two subpaths are **owned** by this package (their standalone packages have been folded in and
removed):

| Subpath | Contents |
| --- | --- |
| `@subsquid/squid-sdk/evm-rpc-stream` | RPC-backed EVM data source with Portal-compatible output |
| `@subsquid/squid-sdk/evm-fallback-stream` | Fallback EVM data source: drives the lowest-index healthy source of N |

The rest are **re-exports** of packages that are still published standalone — import them either
way:

`evm-stream`, `solana-stream`, `fuel-stream`, `starknet-stream`, `util-internal`,
`util-internal-data-source`, `util-internal-range`, `util-internal-hex`, `util-internal-json`,
`util-internal-validation`, `util-internal-processor-tools`, `logger`, `portal-client`,
`http-client`, `rpc-client`, `util-timeout`.

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

## Note on install weight

Folding `evm-rpc-stream` in makes `@subsquid/evm-rpc` and `@subsquid/evm-normalization` hard
dependencies, so installing `@subsquid/squid-sdk` always pulls the EVM RPC stack. The RPC code is
still *loaded* lazily — only when an `rpc` fallback source is actually configured — so a
Portal-only pipeline does not evaluate it.
