import type {Block, DataRequest, EVMDataSource, FieldSelection} from '@subsquid/evm-stream'
import type {RpcMethodOptions} from '../../evm-rpc-stream'
import type {Rpc} from '@subsquid/evm-rpc'
import type {BlockRef} from '@subsquid/util-internal-data-source'
import type {RangeRequestList} from '@subsquid/util-internal-range'

import {CapabilityProbeOptions, makeCapabilityProbe} from '../capability'
import {FallbackDataSource, RankedSource} from '../fallback'
import type {FallbackPolicy} from '../policy'

/**
 * Load the sibling `evm-rpc-stream` subpath lazily, only when an `rpc` source is actually
 * configured. It ships in the same package, so this always resolves; it is deferred (not a
 * top-level import) purely so a Portal-only fallback never pulls the RPC stack (`@subsquid/evm-rpc`
 * + `evm-normalization`) into the module graph until an `rpc` source is built.
 */
function loadRpcStream(): typeof import('../../evm-rpc-stream') {
    return require('../../evm-rpc-stream')
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
