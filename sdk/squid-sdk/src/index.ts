/**
 * `@subsquid/squid-sdk` is an umbrella package. It exposes no members at the root: everything is
 * reached through subpaths, e.g.
 *
 *   import {createEvmFallbackSource} from '@subsquid/squid-sdk/evm-fallback-stream'
 *   import {def} from '@subsquid/squid-sdk/util-internal'
 *
 * The root is intentionally empty to avoid name collisions between the many re-exported packages.
 * See the package README for the full subpath map.
 */
export {}
