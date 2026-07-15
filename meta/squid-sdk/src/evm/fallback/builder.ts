import type {PortalClientOptions} from '@subsquid/portal-client'
import {
    type Block,
    DataSourceBuilder,
    type DataRequest,
    type EVMDataSource,
    type FieldSelection,
    type LogRequest,
    type Query,
    QueryBuilder,
    type StateDiffRequest,
    type TraceRequest,
    type TransactionRequest,
} from '@subsquid/evm-stream'
import type {BlockRef} from '@subsquid/util-internal-data-source'
import {type Range, type RangeRequest, type RangeRequestList, applyRangeBound, mergeRangeRequests} from '@subsquid/util-internal-range'
import assert from 'assert'

import {type CapabilityProbeOptions, makeCapabilityProbe} from '../../fallback/capability'
import {FallbackDataSource, type RankedSource} from '../../fallback/fallback'
import type {FallbackPolicy} from '../../fallback/policy'
import type {NetworkOverrides, RpcMethodOptions} from '../rpc'
import {loadRpcStream} from './load-rpc-stream'

interface BlockRange {
    range?: Range
}

const evmBlockRef = (b: Block<any>): BlockRef => ({number: b.header.number, hash: b.header.hash})

/** JSON-RPC connection + per-network config for an `rpc` fallback source. */
export interface EvmRpcSourceOptions {
    /** JSON-RPC endpoint URL. */
    url: string
    /** Known network slug or chainId — selects the per-network preset (trace/debug method, validation). */
    network?: string | number
    /** Explicit validation/finality overrides, merged over the preset. */
    rpc?: NetworkOverrides['rpc']
    /** Explicit trace/stateDiff method overrides, merged over the preset. */
    method?: RpcMethodOptions
    capacity?: number
    rateLimit?: number
    strideSize?: number
    strideConcurrency?: number
}

/** A SQD Network Portal source — the same options as `DataSourceBuilder#setPortal` (`url`, …). */
export type EvmPortalSourceConfig = {type: 'portal'; name?: string} & PortalClientOptions

/** A JSON-RPC source (with an optional per-network preset and overrides). */
export type EvmRpcSourceConfig = {type: 'rpc'; name?: string} & EvmRpcSourceOptions

/**
 * An arbitrary pre-built `EVMDataSource` — the escape hatch. Unlike `portal`/`rpc` sources, the
 * fallback's shared query is **not** applied to it: you are responsible for building it with the same
 * field selection + query as the other sources, or the fallback's output depends on which one is
 * active.
 */
export interface EvmCustomSourceConfig {
    type: 'source'
    name?: string
    source: EVMDataSource<any>
}

/**
 * A downstream source in an EVM fallback, given as a plain tagged config object. The field selection
 * and query are defined **once** on the {@link EvmFallbackDataSourceBuilder} and applied to every
 * `portal`/`rpc` source, so they all fetch the same data (and produce identical output no matter which
 * one is active). `name` is optional — sources default to `` `${type}-${index}` `` in metrics/logs.
 */
export type EvmFallbackSourceConfig = EvmPortalSourceConfig | EvmRpcSourceConfig | EvmCustomSourceConfig

/**
 * Fluent builder for an EVM fallback data source, shaped like `@subsquid/evm-stream`'s
 * `DataSourceBuilder`: define the field selection + query **once** here (`setFields`, `addLog`, …),
 * list the ordered downstream sources via {@link setDownstreamSources}, and `build()` a
 * `FallbackDataSource<Block<F>>` — a drop-in for a single `EVMDataSource<F>`. `setFields` infers the
 * block type `F`, so field access is fully typed.
 *
 * @example
 * const source = new EvmFallbackDataSourceBuilder()
 *     .setDownstreamSources([
 *         {type: 'portal', url: 'https://portal.sqd.dev/datasets/ethereum-mainnet'},
 *         {type: 'rpc', url: RPC_URL, network: 'ethereum-mainnet'},
 *     ])
 *     .setFields({log: {topics: true, data: true}})
 *     .addLog({where: {address: [CONTRACT], topic0: [TRANSFER]}, range: {from: 10_000_000}})
 *     .build()
 */
export class EvmFallbackDataSourceBuilder<F extends FieldSelection = {}> {
    private downstream: EvmFallbackSourceConfig[] = []
    private requests: RangeRequest<DataRequest>[] = []
    private fields: FieldSelection = {}
    private blockRange?: Range
    private policy?: FallbackPolicy
    private capabilityProbe: boolean | CapabilityProbeOptions = true

    /** Ordered downstream sources, most-preferred first. The fallback drives the first healthy one. */
    setDownstreamSources(sources: EvmFallbackSourceConfig[]): this {
        this.downstream = sources
        return this
    }

    /** Failover/switch-up policy (lag/staleness thresholds, cooldowns, …). Defaults are sensible. */
    setPolicy(policy: FallbackPolicy): this {
        this.policy = policy
        return this
    }

    /**
     * Attach a generic capability probe to every source (default `true`): a source counts as
     * `healthy` only once it confirms it can serve the configured data at the indexing frontier —
     * catching a reachable-but-incapable node (trace/`debug_` disabled, pruned state) before a
     * switch-up promotes it. Pass `false` to govern health by liveness alone, or `{timeoutMs}` to
     * tune the probe.
     */
    setCapabilityProbe(probe: boolean | CapabilityProbeOptions): this {
        this.capabilityProbe = probe
        return this
    }

    // ---- Shared query: mirrors @subsquid/evm-stream DataSourceBuilder, so the API feels identical ----

    /** Limit the range of blocks to fetch (applied across every downstream source). */
    setBlockRange(range?: Range): this {
        this.blockRange = range
        return this
    }

    /** Configure the set of fetched fields — infers the block type `F` for `build()`. */
    setFields<T extends FieldSelection>(fields: T): EvmFallbackDataSourceBuilder<T> {
        this.fields = fields
        return this as unknown as EvmFallbackDataSourceBuilder<T>
    }

    /** Add a query — a set of item filters sharing a block range (accepts a {@link QueryBuilder}). */
    addQuery(query: Query | QueryBuilder): this {
        this.requests.push(query instanceof QueryBuilder ? query.build() : query)
        return this
    }

    /** Shorthand for {@link addQuery} that only sets `includeAllBlocks` (and optionally a range). */
    includeAllBlocks(range?: Range): this {
        return this.addQuery({range: range ?? {from: 0}, request: {includeAllBlocks: true}})
    }

    /** Shorthand for {@link addQuery} with a single log filter. */
    addLog(options: LogRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {logs: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single transaction filter. */
    addTransaction(options: TransactionRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {transactions: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single trace filter. */
    addTrace(options: TraceRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {traces: [req]}})
    }

    /** Shorthand for {@link addQuery} with a single state-diff filter. */
    addStateDiff(options: StateDiffRequest & BlockRange): this {
        let {range, ...req} = options
        return this.addQuery({range: range ?? {from: 0}, request: {stateDiffs: [req]}})
    }

    // Merge + range-bound the accumulated queries (mirrors DataSourceBuilder#getRequests).
    private getRequests(): RangeRequestList<DataRequest> {
        function concat<T>(a?: T[], b?: T[]): T[] | undefined {
            let result = [...(a ?? []), ...(b ?? [])]
            return result.length === 0 ? undefined : result
        }

        let requests = mergeRangeRequests(this.requests, (a, b) => ({
            includeAllBlocks: a.includeAllBlocks || b.includeAllBlocks,
            logs: concat(a.logs, b.logs),
            transactions: concat(a.transactions, b.transactions),
            traces: concat(a.traces, b.traces),
            stateDiffs: concat(a.stateDiffs, b.stateDiffs),
        }))

        return applyRangeBound(requests, this.blockRange)
    }

    /** Build one downstream source from its config, applying the shared field selection + query. */
    private buildDownstream(cfg: EvmFallbackSourceConfig, fields: F, requests: RangeRequestList<DataRequest>): EVMDataSource<F> {
        switch (cfg.type) {
            case 'portal': {
                let {type, name, ...portal} = cfg
                // Drive a fresh canonical Portal builder — never wrap it. Re-feeding the already-merged
                // requests is idempotent: they are disjoint by range, so mergeRangeRequests is a no-op.
                let builder = new DataSourceBuilder().setPortal(portal).setFields(fields)
                for (let req of requests) builder.addQuery(req)
                return builder.build()
            }
            case 'rpc': {
                let {type, name, ...options} = cfg
                // Lazy: this is the only point that touches the optional @subsquid/evm-rpc peer.
                return loadRpcStream().evmRpcStream({...options, fields, requests})
            }
            case 'source':
                return cfg.source
        }
    }

    /** Build the fallback data source. Requires at least one downstream source. */
    build(): FallbackDataSource<Block<F>> {
        assert(this.downstream.length > 0, 'No downstream sources — call setDownstreamSources([...])')

        let fields = this.fields as F
        let requests = this.getRequests()

        let ranked: RankedSource<Block<F>>[] = this.downstream.map((cfg, i) => {
            let source = this.buildDownstream(cfg, fields, requests)
            let probeCapability =
                this.capabilityProbe === false
                    ? undefined
                    : makeCapabilityProbe(source, this.capabilityProbe === true ? undefined : this.capabilityProbe)
            return {name: cfg.name ?? `${cfg.type}-${i}`, source, probeCapability}
        })

        return new FallbackDataSource<Block<F>>({sources: ranked, getBlockRef: evmBlockRef, policy: this.policy})
    }
}
