# Change Log - @subsquid/squid-sdk

This log was last generated on Thu, 16 Jul 2026 19:47:53 GMT and should not be manually modified.

## 0.4.0
Thu, 16 Jul 2026 19:47:53 GMT

### Minor changes

- evm/fallback: richer `setDownstreamSources` docstring (all `type` variants + a portal/rpc `@example`) so the empty-array call site is self-documenting. evm/rpc: `network` is now typed `EvmNetwork` — the known preset slugs autocomplete while any other slug/chainId is still accepted (`KnownNetwork` is derived from the shipped presets and test-guarded against drift). Editor discoverability: the build emits a directory redirect per subpath so nested paths like `@subsquid/squid-sdk/evm/` autocomplete their children under classic (node10) resolution. The `fallback` subpath now re-exports only its intended public surface — the supervisor, its options/metrics, the policy, the all-down error, the capability-probe API, and the metrics sink; internal helpers (redactUrl, redactText, classifyError, freshnessFailure, capabilityFailure, resolvePolicy, ResolvedPolicy, Selector, SourceHealth) that were previously reachable through it are no longer exported. New subpaths: `evm/objects` (@subsquid/evm-objects), `processor` (@subsquid/batch-processor), and `store/typeorm` (@subsquid/typeorm-store; needs `typeorm`/`@subsquid/big-decimal` peers).
- feat(fallback): FallbackDataSource now exposes `getMetricsSink()`, so a fallback source passed to the batch-processor's `run()` gets its `sqd_fallback_*` gauges registered on `/metrics` automatically — no manual `addMetricsSink(fallbackMetricsSink(src))` needed. `fallbackMetricsSink` is now idempotent per registry, so a leftover manual registration alongside the automatic one no longer throws on duplicate gauge names.

## 0.3.0
Wed, 15 Jul 2026 22:15:56 GMT

### Minor changes

- evm/fallback: downstream sources are now plain tagged config objects ({type: 'portal'|'rpc'|'custom', name?, ...}) instead of builder classes; the fallback applies the shared field selection + query to every source at build(). The 'custom' escape hatch takes a buildSource(fields, requests) that receives the shared query (nothing is exempt). evm/rpc: add a fluent EvmRpcDataSourceBuilder — the RPC counterpart of evm-stream's DataSourceBuilder (identical query surface, setRpc instead of setPortal) — for standalone single-source use. The low-level evmRpcStream function is no longer part of the public evm/rpc surface (use EvmRpcDataSourceBuilder). BREAKING: removes EvmPortalDataSourceBuilder/EvmRpcDataSourceBuilder/EvmDownstreamSourceBuilder from evm/fallback and evmRpcStream/EvmRpcStreamConfig from evm/rpc; adds EvmFallbackSourceConfig and (in evm/rpc) EvmRpcDataSourceBuilder + EvmRpcOptions. Ergonomics: an RPC source with no matching network preset and no explicit rpc/method overrides now logs a warning that validation is off and Portal parity is unverified (instead of silently disabling validation); and evm/fallback re-exports AllSourcesDownError + FallbackPolicy so consumers can catch/type them without also importing @subsquid/squid-sdk/fallback.

## 0.2.0
Wed, 15 Jul 2026 01:21:06 GMT

### Minor changes

- evm/fallback: new fluent EvmFallbackDataSourceBuilder (with EvmPortalDataSourceBuilder / EvmRpcDataSourceBuilder) mirroring @subsquid/evm-stream's DataSourceBuilder. BREAKING: removes the old createEvmFallbackSource / EvmFallbackOptions / EvmFallbackSourceConfig API.

## 0.1.1
Tue, 14 Jul 2026 13:09:33 GMT

### Patches

- Release to npm via GitHub Actions trusted publishing (OIDC)

## 0.1.0
Wed, 08 Jul 2026 22:11:26 GMT

### Minor changes

- New umbrella package exposing SDK data sources and utilities as subpaths; folds in @subsquid/evm-rpc-stream and @subsquid/evm-fallback-stream (standalone versions removed) and re-exports the core *-stream and util packages.

### Patches

- Drop the `starknet` subpath: @subsquid/starknet-stream is uninstallable from npm because its @subsquid/starknet-rpc@^0.0.2 dependency is docker-policy and unpublished (only 0.0.1 on npm), which broke `npm install @subsquid/squid-sdk`.
- Add the `./package.json` subpath export (an `exports` map is a hard allowlist, so `require('@subsquid/squid-sdk/package.json')` previously threw ERR_PACKAGE_PATH_NOT_EXPORTED) and an in-package guard test keeping the `exports`/`typesVersions`/barrel maps in sync. Internal fallback-supervisor and evm/rpc refactors (shared timeout/iterator-close helpers, a `selectActive` failover generator, aggregate logs/receipts de-duplication) with no public API change.

