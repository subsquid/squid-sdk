# Change Log - @subsquid/squid-sdk

This log was last generated on Wed, 08 Jul 2026 22:11:26 GMT and should not be manually modified.

## 0.1.0
Wed, 08 Jul 2026 22:11:26 GMT

### Minor changes

- New umbrella package exposing SDK data sources and utilities as subpaths; folds in @subsquid/evm-rpc-stream and @subsquid/evm-fallback-stream (standalone versions removed) and re-exports the core *-stream and util packages.

### Patches

- Drop the `starknet` subpath: @subsquid/starknet-stream is uninstallable from npm because its @subsquid/starknet-rpc@^0.0.2 dependency is docker-policy and unpublished (only 0.0.1 on npm), which broke `npm install @subsquid/squid-sdk`.
- Add the `./package.json` subpath export (an `exports` map is a hard allowlist, so `require('@subsquid/squid-sdk/package.json')` previously threw ERR_PACKAGE_PATH_NOT_EXPORTED) and an in-package guard test keeping the `exports`/`typesVersions`/barrel maps in sync. Internal fallback-supervisor and evm/rpc refactors (shared timeout/iterator-close helpers, a `selectActive` failover generator, aggregate logs/receipts de-duplication) with no public API change.

