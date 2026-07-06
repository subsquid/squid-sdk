import {EvmRpcClient, Rpc} from '@subsquid/evm-rpc'
import {DataRequest, FieldSelection} from '@subsquid/evm-stream'
import {RangeRequestList} from '@subsquid/util-internal-range'

import {NetworkOverrides, resolveNetworkSettings} from './networks'
import {EvmRpcStreamDataSource, RpcMethodOptions} from './source/data-source'

export interface EvmRpcStreamConfig<F extends FieldSelection> {
    /** JSON-RPC endpoint URL. */
    url: string
    /** Known network slug or chainId — selects the per-network C1 preset (§5 S5). */
    network?: string | number
    fields: F
    requests: RangeRequestList<DataRequest>
    /** Explicit C1 validation/finality overrides (merged over the preset). */
    rpc?: NetworkOverrides['rpc']
    /** Explicit trace/stateDiff method overrides (merged over the preset). */
    method?: RpcMethodOptions
    capacity?: number
    rateLimit?: number
    strideSize?: number
    strideConcurrency?: number
}

/**
 * Build an RPC `DataSource<Block<F>>` from a simple config, resolving the per-network C1 settings
 * from `network` (preset) ⊕ explicit overrides (§5 S5 / S6). `evm-rpc` auto-handles
 * chainId/response-shape quirks; this only supplies the deploy-config layer it can't auto-detect.
 */
export function evmRpcStream<F extends FieldSelection>(config: EvmRpcStreamConfig<F>): EvmRpcStreamDataSource<F> {
    const settings = resolveNetworkSettings(config.network, {rpc: config.rpc, method: config.method})

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
