import {EvmRpcClient, Rpc} from '@subsquid/evm-rpc'
import {DataRequest, FieldSelection} from '@subsquid/evm-stream'
import {createLogger} from '@subsquid/logger'
import {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'

import {redactUrl} from '../../redact'
import {EvmQueryBuilder} from '../query-builder'
import {getNetworkPreset, NetworkOverrides, resolveNetworkSettings} from './networks'
import {EvmRpcStreamDataSource, RpcMethodOptions} from './source/data-source'

const log = createLogger('sqd:evm-rpc')

/** JSON-RPC connection + per-network config, shared by {@link evmRpcStream}, {@link EvmRpcDataSourceBuilder}, and the `rpc` fallback source. */
export interface EvmRpcOptions {
    /** JSON-RPC endpoint URL. */
    url: string
    /** Known network slug or chainId — selects the per-network preset (trace/debug method, validation). */
    network?: string | number
    /** Explicit validation/finality overrides (merged over the preset). */
    rpc?: NetworkOverrides['rpc']
    /** Explicit trace/stateDiff method overrides (merged over the preset). */
    method?: RpcMethodOptions
    capacity?: number
    rateLimit?: number
    strideSize?: number
    strideConcurrency?: number
}

export interface EvmRpcStreamConfig<F extends FieldSelection> extends EvmRpcOptions {
    fields: F
    requests: RangeRequestList<DataRequest>
}

/**
 * Build an RPC `DataSource<Block<F>>` from a simple config, resolving the per-network settings
 * from `network` (preset) ⊕ explicit overrides. `evm-rpc` auto-handles
 * chainId/response-shape quirks; this only supplies the deploy-config layer it can't auto-detect.
 */
export function evmRpcStream<F extends FieldSelection>(config: EvmRpcStreamConfig<F>): EvmRpcStreamDataSource<F> {
    const settings = resolveNetworkSettings(config.network, {rpc: config.rpc, method: config.method})
    warnIfParityUnverified(config)

    const client = new EvmRpcClient({
        url: config.url,
        capacity: config.capacity,
        rateLimit: config.rateLimit,
    })
    const rpc = new Rpc({client, ...settings.rpc})

    return new EvmRpcStreamDataSource<F>({
        rpc,
        fields: config.fields,
        requests: config.requests,
        method: settings.method,
        strideSize: config.strideSize,
        strideConcurrency: config.strideConcurrency,
    })
}

/**
 * True when an RPC source would run without any block validation or method tuning: no matching
 * network preset **and** no explicit `rpc`/`method` overrides. The resulting settings are safe
 * defaults, but dataset parity with the Portal is not guaranteed. Explicit overrides count as the
 * caller taking ownership of per-chain config, so they clear this. Exported for testing; not part of
 * the public `evm/rpc` surface.
 */
export function isParityUnverified(config: EvmRpcOptions): boolean {
    let hasPreset = config.network != null && getNetworkPreset(config.network) != null
    let hasOverrides = config.rpc != null || config.method != null
    return !hasPreset && !hasOverrides
}

/** Warn (rather than fail silently) when a source's parity is unverified — easy to hit by accident. */
function warnIfParityUnverified(config: EvmRpcOptions): void {
    if (!isParityUnverified(config)) return
    let network = config.network == null ? 'network unset' : `unknown network '${config.network}'`
    // Redact the endpoint — provider RPC URLs routinely embed API keys in the path/query.
    let endpoint = redactUrl(config.url) ?? '<rpc endpoint>'
    log.warn(
        `RPC source for ${endpoint}: ${network} and no rpc/method overrides — block validation is ` +
            `disabled and dataset parity with the Portal is not guaranteed. Set 'network' to a supported ` +
            `slug/chainId, or supply explicit 'rpc'/'method' overrides.`,
    )
}

/**
 * Fluent builder for a standalone JSON-RPC EVM data source — the RPC counterpart of
 * `@subsquid/evm-stream`'s `DataSourceBuilder`, with an identical query surface
 * (`setFields`/`addLog`/…). The only difference is `setRpc(...)` in place of `setPortal(...)`.
 *
 * @example
 * const source = new EvmRpcDataSourceBuilder()
 *     .setRpc({url: RPC_URL, network: 'ethereum-mainnet'})
 *     .setFields({log: {topics: true, data: true}})
 *     .addLog({where: {address: [CONTRACT], topic0: [TRANSFER]}, range: {from: 10_000_000}})
 *     .build()
 */
export class EvmRpcDataSourceBuilder<F extends FieldSelection = {}> extends EvmQueryBuilder {
    private options?: EvmRpcOptions

    /**
     * Configure the JSON-RPC endpoint — a bare URL, or {@link EvmRpcOptions} for a per-network preset,
     * method/validation overrides, and connection tuning.
     */
    setRpc(options: string | EvmRpcOptions): this {
        this.options = typeof options === 'string' ? {url: options} : options
        return this
    }

    /** Configure the set of fetched fields — infers the block type `F` for `build()`. */
    setFields<T extends FieldSelection>(fields: T): EvmRpcDataSourceBuilder<T> {
        this.fields = fields
        return this as unknown as EvmRpcDataSourceBuilder<T>
    }

    /** Build the RPC data source from this builder's field selection + query. */
    build(): EvmRpcStreamDataSource<F> {
        assert(this.options, 'RPC endpoint not set — call setRpc(...)')
        return evmRpcStream({...this.options, fields: this.fields as F, requests: this.getRequests()})
    }
}
