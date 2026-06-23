import {Block, DataRequest, EVMDataSource, FieldSelection} from '@subsquid/evm-stream'
import {EvmRpcStreamDataSource, RpcMethodOptions} from '@subsquid/evm-rpc-stream'
import {Rpc} from '@subsquid/evm-rpc'
import {BlockRef} from '@subsquid/util-internal-data-source'
import {RangeRequestList} from '@subsquid/util-internal-range'

import {FallbackDataSource, RankedSource} from '../fallback'
import {FallbackPolicy} from '../policy'

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
                : new EvmRpcStreamDataSource({
                      rpc: cfg.rpc,
                      fields: options.fields,
                      requests: options.requests,
                      method: cfg.method,
                      strideSize: cfg.strideSize,
                      strideConcurrency: cfg.strideConcurrency,
                  })

        return {name: cfg.name ?? `${cfg.type}-${i}`, source}
    })

    return new FallbackDataSource<Block<F>>({
        sources: ranked,
        getBlockRef: evmBlockRef,
        policy: options.policy,
    })
}
