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

/**
 * Slugs of the shipped network presets. Passing one of these (or the matching chainId) as `network`
 * unlocks the preset's block validation + trace/debug method tuning. Kept in sync with
 * {@link NETWORK_PRESETS} by a unit test.
 */
export const KNOWN_NETWORKS = [
    'ethereum-mainnet',
    'optimism-mainnet',
    'base-mainnet',
    'arbitrum-one',
    'gnosis-mainnet',
    'polygon-mainnet',
    'cronos-mainnet',
] as const

/** A slug of a shipped network preset (see {@link KNOWN_NETWORKS}). */
export type KnownNetwork = (typeof KNOWN_NETWORKS)[number]

/**
 * The `network` selector for an RPC source: a known preset slug (offered in editor autocomplete), or
 * any other slug/chainId. Unknown values are accepted — they resolve to empty settings (validation
 * off); building an RPC source (`evmRpcStream` / the builders) logs a warning in that case, though
 * {@link resolveNetworkSettings} itself does not. The `string & {}` member keeps the known-slug
 * suggestions visible while still allowing an arbitrary string.
 */
export type EvmNetwork = KnownNetwork | (string & {}) | number

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
