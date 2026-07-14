import {PortalClient, type PortalClientOptions} from '@subsquid/portal-client'
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
import type {NetworkOverrides} from '../rpc/networks'
import type {RpcMethodOptions} from '../rpc/source/data-source'
import {loadRpcStream} from './load-rpc-stream'

interface BlockRange {
    range?: Range
}

const evmBlockRef = (b: Block<any>): BlockRef => ({number: b.header.number, hash: b.header.hash})

/**
 * A downstream source in an EVM fallback — **connection config only**. The field selection and query
 * are defined once on the {@link EvmFallbackDataSourceBuilder} and passed to every downstream's
 * {@link buildSource}, so all sources fetch the same data and produce identical output no matter
 * which one is active. Implemented by {@link EvmPortalDataSourceBuilder} and
 * {@link EvmRpcDataSourceBuilder}.
 *
 * Implementing this interface directly is an escape hatch for wrapping an arbitrary pre-built
 * `EVMDataSource`. If you do, **`buildSource` must build from the `fields` and `requests` it is
 * given** — a source configured with a different field selection or query makes the fallback's
 * output silently depend on which source is currently active, defeating the purpose of a fallback.
 */
export interface EvmDownstreamSourceBuilder {
    /** Fallback for the source's metrics/log name when {@link name} is unset. */
    readonly defaultName: string
    readonly name?: string
    /**
     * Finalize into a full data source. Must build from the given `fields` and `requests` — the
     * fallback's shared selection and query — so every source in the fallback returns identical data.
     */
    buildSource<F extends FieldSelection>(fields: F, requests: RangeRequestList<DataRequest>): EVMDataSource<F>
}

/**
 * A SQD Network Portal source in an EVM fallback. Mirrors `@subsquid/evm-stream`'s
 * `DataSourceBuilder#setPortal` — pass a URL, {@link PortalClientOptions}, or a {@link PortalClient}.
 */
export class EvmPortalDataSourceBuilder implements EvmDownstreamSourceBuilder {
    readonly defaultName = 'portal'
    name?: string
    private portal?: PortalClient | PortalClientOptions

    /** Optional explicit name for this source in metrics/logs (default `portal-<index>`). */
    setName(name: string): this {
        this.name = name
        return this
    }

    /**
     * Set the SQD Network Portal endpoint.
     *
     * @example
     * new EvmPortalDataSourceBuilder().setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet')
     */
    setPortal(portal: string | PortalClientOptions | PortalClient): this {
        this.portal = typeof portal === 'string' ? {url: portal} : portal
        return this
    }

    buildSource<F extends FieldSelection>(fields: F, requests: RangeRequestList<DataRequest>): EVMDataSource<F> {
        assert(this.portal, 'Portal endpoint not set — call setPortal(...) on the portal source')
        // Reuse the canonical Portal builder so a fallback Portal source is byte-for-byte what a
        // standalone one would be. Re-feeding the already-merged requests is idempotent: they are
        // disjoint by range, so mergeRangeRequests leaves them untouched.
        let builder = new DataSourceBuilder().setPortal(this.portal).setFields(fields)
        for (let req of requests) builder.addQuery(req)
        return builder.build()
    }
}

/** Connection + per-network config for an {@link EvmRpcDataSourceBuilder} (everything `evmRpcStream` takes bar the shared `fields`/`requests`). */
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

/**
 * A JSON-RPC source in an EVM fallback. Configured by endpoint (with an optional per-network preset
 * and overrides); the `@subsquid/evm-rpc` stack is loaded lazily, only when the source is built.
 */
export class EvmRpcDataSourceBuilder implements EvmDownstreamSourceBuilder {
    readonly defaultName = 'rpc'
    name?: string
    private options?: EvmRpcSourceOptions

    /** Optional explicit name for this source in metrics/logs (default `rpc-<index>`). */
    setName(name: string): this {
        this.name = name
        return this
    }

    /**
     * Configure the JSON-RPC data source — a bare endpoint URL, or {@link EvmRpcSourceOptions} for a
     * per-network preset, method/validation overrides, and connection tuning.
     *
     * @example
     * new EvmRpcDataSourceBuilder().setRpc({url: 'https://rpc...', network: 'ethereum-mainnet'})
     */
    setRpc(options: string | EvmRpcSourceOptions): this {
        this.options = typeof options === 'string' ? {url: options} : options
        return this
    }

    buildSource<F extends FieldSelection>(fields: F, requests: RangeRequestList<DataRequest>): EVMDataSource<F> {
        assert(this.options, 'RPC endpoint not set — call setRpc(...) on the rpc source')
        // Lazy: this is the only point that touches the optional @subsquid/evm-rpc peer.
        return loadRpcStream().evmRpcStream({...this.options, fields, requests})
    }
}

/**
 * Fluent builder for an EVM fallback data source, shaped like `@subsquid/evm-stream`'s
 * `DataSourceBuilder`: define the field selection + query **once** here (`setFields`, `addLog`, …),
 * list the ordered downstream sources (Portal and/or RPC) via {@link setDownstreamSources}, and
 * `build()` a `FallbackDataSource<Block<F>>` — a drop-in for a single `EVMDataSource<F>`.
 *
 * @example
 * const source = new EvmFallbackDataSourceBuilder()
 *     .setDownstreamSources([
 *         new EvmPortalDataSourceBuilder().setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet'),
 *         new EvmRpcDataSourceBuilder().setRpc({url: RPC_URL, network: 'ethereum-mainnet'}),
 *     ])
 *     .setFields({log: {topics: true, data: true}})
 *     .addLog({where: {address: [CONTRACT], topic0: [TRANSFER]}, range: {from: 10_000_000}})
 *     .build()
 */
export class EvmFallbackDataSourceBuilder<F extends FieldSelection = {}> {
    private downstream: EvmDownstreamSourceBuilder[] = []
    private requests: RangeRequest<DataRequest>[] = []
    private fields?: FieldSelection
    private blockRange?: Range
    private policy?: FallbackPolicy
    private capabilityProbe: boolean | CapabilityProbeOptions = true

    /** Ordered downstream sources, most-preferred first. The fallback drives the first healthy one. */
    setDownstreamSources(sources: EvmDownstreamSourceBuilder[]): this {
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

    /** Add a portal query — a set of item filters sharing a block range (accepts a {@link QueryBuilder}). */
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

    /** Build the fallback data source. Requires at least one downstream source. */
    build(): FallbackDataSource<Block<F>> {
        assert(this.downstream.length > 0, 'No downstream sources — call setDownstreamSources([...])')

        let fields = (this.fields ?? {}) as F
        let requests = this.getRequests()

        let ranked: RankedSource<Block<F>>[] = this.downstream.map((d, i) => {
            let source = d.buildSource(fields, requests)
            let probeCapability =
                this.capabilityProbe === false
                    ? undefined
                    : makeCapabilityProbe(source, this.capabilityProbe === true ? undefined : this.capabilityProbe)
            return {name: d.name ?? `${d.defaultName}-${i}`, source, probeCapability}
        })

        return new FallbackDataSource<Block<F>>({sources: ranked, getBlockRef: evmBlockRef, policy: this.policy})
    }
}
