import {RpcMethodOptions} from '../source/data-source'

import {arbitrumOne} from './arbitrum-one'
import {baseMainnet} from './base-mainnet'
import {cronosMainnet} from './cronos-mainnet'
import {ethereumMainnet} from './ethereum-mainnet'
import {gnosisMainnet} from './gnosis-mainnet'
import {optimismMainnet} from './optimism-mainnet'
import {polygonMainnet} from './polygon-mainnet'
import {NetworkPreset, ResolvedNetworkSettings, RpcValidationOptions} from './types'

export * from './types'
export {standardValidation, opStackMethod} from './_families'

/** Shipped per-network presets (Tier-1: parity-safe modern-pipeline chains first). */
export const NETWORK_PRESETS: NetworkPreset[] = [
    ethereumMainnet,
    optimismMainnet,
    baseMainnet,
    arbitrumOne,
    gnosisMainnet,
    polygonMainnet,
    cronosMainnet,
]

const BY_SLUG = new Map(NETWORK_PRESETS.map((p) => [p.slug, p]))
const BY_CHAIN_ID = new Map(NETWORK_PRESETS.map((p) => [p.chainId, p]))

/** Look up a preset by slug or chainId. */
export function getNetworkPreset(network: string | number): NetworkPreset | undefined {
    return typeof network === 'number' ? BY_CHAIN_ID.get(network) : BY_SLUG.get(network)
}

export interface NetworkOverrides {
    rpc?: RpcValidationOptions
    method?: RpcMethodOptions
}

/**
 * Resolve the effective settings: `preset(network)` overlaid with explicit `overrides`. An
 * unknown network with no overrides resolves to empty (safe) settings — the caller should warn
 * that dataset parity isn't guaranteed without a preset or explicit per-chain config.
 */
export function resolveNetworkSettings(
    network?: string | number,
    overrides?: NetworkOverrides,
): ResolvedNetworkSettings {
    const preset = network != null ? getNetworkPreset(network) : undefined

    return {
        rpc: {...preset?.rpc, ...overrides?.rpc},
        method: {...preset?.method, ...overrides?.method},
    }
}
