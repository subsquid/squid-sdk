import {RpcMethodOptions} from '../source/data-source'

/**
 * Validation + finality settings (the per-chain "C1" deploy-config layer) passed to the
 * `@subsquid/evm-rpc` `Rpc`. Keys mirror `RpcOptions`; all default off, presets opt in.
 */
export interface RpcValidationOptions {
    finalityConfirmation?: number
    verifyBlockHash?: boolean
    verifyTxSender?: boolean
    verifyTxRoot?: boolean
    verifyReceiptsRoot?: boolean
    verifyWithdrawalsRoot?: boolean
    verifyLogsBloom?: boolean
    checkLogIndex?: boolean
    checkCumulativeGasUsed?: boolean
    useGasUsedForReceiptsRoot?: boolean
}

/**
 * A per-network settings preset mirroring that network's infra deploy config, so the RPC source
 * produces output matching the Portal dataset (plan §5 S5). Keyed by `chainId` (+ slug). These
 * duplicate infra lore in the SDK by design and are temporary; the long-term home is inside
 * `evm-rpc`'s chain modules.
 */
export interface NetworkPreset {
    slug: string
    chainId: number
    /** Family note (op-stack, bor, ethermint, …) — documentation only. */
    family?: string
    rpc?: RpcValidationOptions
    method?: RpcMethodOptions
}

export interface ResolvedNetworkSettings {
    rpc: RpcValidationOptions
    method: RpcMethodOptions
}
