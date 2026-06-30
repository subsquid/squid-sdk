import type {Block, DataRequest, EVMDataSource, FieldSelection} from '@subsquid/evm-stream'
import type {RpcMethodOptions} from '@subsquid/evm-rpc-stream'
import type {Rpc} from '@subsquid/evm-rpc'
import type {BlockRef} from '@subsquid/util-internal-data-source'
import type {RangeRequestList} from '@subsquid/util-internal-range'

import {CapabilityProbeOptions, makeCapabilityProbe} from '../capability'
import {FallbackDataSource, RankedSource} from '../fallback'
import type {FallbackPolicy} from '../policy'

/**
 * Load `@subsquid/evm-rpc-stream` lazily, only when an `rpc` source is actually configured. The
 * package (and `@subsquid/evm-rpc`) are *optional* peers: Portal-only users carry neither, and the
 * EVM glue is re-exported from the package entrypoint, so an eager top-level import would make
 * `require('@subsquid/evm-fallback-stream')` crash for them. The `require` is reached only on the
 * `rpc` branch below; if the peers are missing it fails with an actionable message instead.
 */
function loadRpcStream(): typeof import('@subsquid/evm-rpc-stream') {
    try {
        return require('@subsquid/evm-rpc-stream')
    } catch (e) {
        // Only translate "the package itself isn't installed" into the actionable hint, matching the
        // missing module by its exact quoted name in the error text. A MODULE_NOT_FOUND for a
        // *transitive* dependency inside the package (a broken install) names a different module —
        // and a real fault thrown on load isn't MODULE_NOT_FOUND at all — so both surface unchanged
        // rather than being masked as "peers missing". (Node: `Cannot find module '<name>'`.)
        let err = e as NodeJS.ErrnoException
        if (err?.code === 'MODULE_NOT_FOUND' && err.message.includes("'@subsquid/evm-rpc-stream'")) {
            throw new Error(
                "An 'rpc' fallback source requires the optional peer dependencies '@subsquid/evm-rpc-stream' " +
                    "and '@subsquid/evm-rpc'. Install them, or use only 'portal' sources.",
            )
        }
        throw e
    }
}

/**
 * One source in an EVM fallback, ranked by its position in the list. Both kinds share the same
 * `fields` + `requests` (set on the fallback), so they produce identical output. A `portal`
 * source is any already-built `EVMDataSource` (e.g. from `@subsquid/evm-stream`'s
 * `DataSourceBuilder`); an `rpc` source is built here from an `@subsquid/evm-rpc` `Rpc`.
 */
export type EvmFallbackSourceConfig<F extends FieldSelection> =
    | {name?: string; type: 'portal'; source: EVMDataSource<F>}
    | {name?: string; type: 'rpc'; rpc: Rpc; method?: RpcMethodOptions; strideSize?: number; strideConcurrency?: number}

export interface EvmFallbackOptions<F extends FieldSelection> {
    fields: F
    requests: RangeRequestList<DataRequest>
    sources: EvmFallbackSourceConfig<F>[]
    policy?: FallbackPolicy
    /**
     * Attach a generic capability probe to every source (default `true`): a source counts as
     * `healthy` only once it confirms it can serve the configured data at the indexing frontier —
     * catching a reachable-but-incapable node (trace/`debug_` disabled, pruned state) before a
     * switch-up promotes it. Pass `false` to govern health by liveness alone, or `{timeoutMs}` to
     * tune the probe.
     */
    capabilityProbe?: boolean | CapabilityProbeOptions
}

const evmBlockRef = (b: Block<any>): BlockRef => ({number: b.header.number, hash: b.header.hash})

/**
 * Build a `FallbackDataSource<Block<F>>` from an ordered list of EVM sources (Portal and/or
 * RPC). Drop-in for a single `EVMDataSource<F>` — the processor needs no changes (plan §2).
 */
export function createEvmFallbackSource<F extends FieldSelection>(
    options: EvmFallbackOptions<F>,
): FallbackDataSource<Block<F>> {
    let ranked: RankedSource<Block<F>>[] = options.sources.map((cfg, i) => {
        let source: EVMDataSource<F> =
            cfg.type === 'portal'
                ? cfg.source
                : new (loadRpcStream().EvmRpcStreamDataSource)({
                      rpc: cfg.rpc,
                      fields: options.fields,
                      requests: options.requests,
                      method: cfg.method,
                      strideSize: cfg.strideSize,
                      strideConcurrency: cfg.strideConcurrency,
                  })

        let probeCapability =
            options.capabilityProbe === false
                ? undefined
                : makeCapabilityProbe(source, options.capabilityProbe === true ? undefined : options.capabilityProbe)

        return {name: cfg.name ?? `${cfg.type}-${i}`, source, probeCapability}
    })

    return new FallbackDataSource<Block<F>>({
        sources: ranked,
        getBlockRef: evmBlockRef,
        policy: options.policy,
    })
}
