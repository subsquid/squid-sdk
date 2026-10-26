import type {PortalClientOptions} from '@subsquid/portal-client'
import {
    type Block,
    type DataRequest,
    DataSourceBuilder,
    type FieldSelection,
    type SolanaDataSource,
} from '@subsquid/solana-stream'
import type {BlockRef} from '@subsquid/util-internal-data-source'
import type {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'

import {SolanaQueryBuilder} from '../query-builder'
import type {SolanaRpcOptions} from '../rpc'
import {type CapabilityProbeOptions, makeCapabilityProbe} from '../../fallback/capability'
import {FallbackDataSource, type RankedSource} from '../../fallback/fallback'
import type {FallbackPolicy} from '../../fallback/policy'
import {loadRpcStream} from './load-rpc-stream'

const solanaBlockRef = (b: Block<any>): BlockRef => ({number: b.header.number, hash: b.header.hash})

/** A SQD Network Portal source — the same options as `DataSourceBuilder#setPortal` (`url`, …). */
export type SolanaPortalSourceConfig = {type: 'portal'; name?: string} & PortalClientOptions

/** A JSON-RPC source. */
export type SolanaRpcSourceConfig = {type: 'rpc'; name?: string} & SolanaRpcOptions

/**
 * A custom source — the escape hatch. Its {@link buildSource} is handed the fallback's shared field
 * selection + requests, exactly like `portal`/`rpc` sources, so it can build a matching source. A
 * source that doesn't use them (e.g. wrapping an already-built one) may ignore its arguments — but
 * then it is on you to keep it consistent with the others, or output depends on which is active.
 */
export interface SolanaCustomSourceConfig {
    type: 'custom'
    name?: string
    buildSource(fields: FieldSelection, requests: RangeRequestList<DataRequest>): SolanaDataSource<any>
}

/**
 * A downstream source in a Solana fallback, given as a plain tagged config object. The field
 * selection and query are defined **once** on the {@link SolanaFallbackDataSourceBuilder} and
 * applied to every source, so they all fetch the same data (and produce identical output no matter
 * which one is active). `name` is optional — sources default to `` `${type}-${index}` `` in
 * metrics/logs.
 */
export type SolanaFallbackSourceConfig = SolanaPortalSourceConfig | SolanaRpcSourceConfig | SolanaCustomSourceConfig

/**
 * Fluent builder for a Solana fallback data source, shaped like `@subsquid/solana-stream`'s
 * `DataSourceBuilder`: define the field selection + query **once** here (`setFields`,
 * `addInstruction`, …), list the ordered downstream sources via {@link setDownstreamSources}, and
 * `build()` a `FallbackDataSource<Block<F>>` — a drop-in for a single `SolanaDataSource<F>`.
 * `setFields` infers the block type `F`, so field access is fully typed.
 *
 * @example
 * const source = new SolanaFallbackDataSourceBuilder()
 *     .setDownstreamSources([
 *         {type: 'portal', url: 'https://portal.sqd.dev/datasets/solana-mainnet'},
 *         {type: 'rpc', url: RPC_URL},
 *     ])
 *     .setFields({instruction: {programId: true, data: true}})
 *     .addInstruction({where: {programId: [PROGRAM_ID]}, range: {from: 250_000_000}})
 *     .build()
 */
export class SolanaFallbackDataSourceBuilder<F extends FieldSelection = {}> extends SolanaQueryBuilder {
    private downstream: SolanaFallbackSourceConfig[] = []
    private policy?: FallbackPolicy
    private capabilityProbe: boolean | CapabilityProbeOptions = true

    /**
     * The ordered list of downstream sources, most-preferred first — the fallback drives the first
     * healthy one and fails over (and back up) as health changes. Each entry is a plain tagged config
     * object; the shared field selection + query (`setFields`/`addInstruction`/…) is applied to every
     * source, so they all fetch identical data.
     *
     * - `{type: 'portal', url}` — a SQD Network Portal dataset (same options as `DataSourceBuilder#setPortal`).
     * - `{type: 'rpc', url}` — a JSON-RPC endpoint ({@link SolanaRpcSourceConfig}).
     * - `{type: 'custom', buildSource}` — the escape hatch ({@link SolanaCustomSourceConfig}).
     *
     * `name` is optional on each entry and defaults to `` `${type}-${index}` `` in metrics/logs.
     *
     * @example
     * .setDownstreamSources([
     *     {type: 'portal', url: 'https://portal.sqd.dev/datasets/solana-mainnet'},
     *     {type: 'rpc', url: process.env.SOLANA_RPC_URL!},
     * ])
     */
    setDownstreamSources(sources: SolanaFallbackSourceConfig[]): this {
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
     * catching a reachable-but-incapable node (e.g. one without historical blocks) before a
     * switch-up promotes it. Pass `false` to govern health by liveness alone, or `{timeoutMs}` to
     * tune the probe.
     */
    setCapabilityProbe(probe: boolean | CapabilityProbeOptions): this {
        this.capabilityProbe = probe
        return this
    }

    /** Configure the set of fetched fields — infers the block type `F` for `build()`. */
    setFields<T extends FieldSelection>(fields: T): SolanaFallbackDataSourceBuilder<T> {
        this.fields = fields
        return this as unknown as SolanaFallbackDataSourceBuilder<T>
    }

    /** Build one downstream source from its config, applying the shared field selection + query. */
    private buildDownstream(
        cfg: SolanaFallbackSourceConfig,
        fields: F,
        requests: RangeRequestList<DataRequest>,
    ): SolanaDataSource<F> {
        switch (cfg.type) {
            case 'portal': {
                let {type, name, ...portal} = cfg
                assert(portal.url, "portal fallback source requires a 'url' (the portal dataset endpoint)")
                // Drive a fresh canonical Portal builder — never wrap it. The requests are already merged
                // (by getRequests()); re-adding them via addQuery is safe because DataSourceBuilder merges
                // again internally and the ranges are disjoint, so that re-merge is a no-op.
                let builder = new DataSourceBuilder().setPortal(portal).setFields(fields)
                for (let req of requests) builder.addQuery(req)
                return builder.build()
            }
            case 'rpc': {
                let {type, name, ...options} = cfg
                assert(options.url, "rpc fallback source requires a 'url' (the JSON-RPC endpoint)")
                // Lazy: this is the only point that touches the optional @subsquid/solana-rpc peer.
                return loadRpcStream().solanaRpcStream({...options, fields, requests})
            }
            case 'custom':
                return cfg.buildSource(fields, requests)
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

        return new FallbackDataSource<Block<F>>({sources: ranked, getBlockRef: solanaBlockRef, policy: this.policy})
    }
}
