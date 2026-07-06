import {standardValidation} from './_families'
import {NetworkPreset} from './types'

/**
 * Ethereum mainnet. Full validation; finality from the `finalized` tag. Traces use the default
 * debug `callTracer`; state diffs use `trace_replayBlockTransactions` (the defaults — no
 * `trace_api`, no `debug_api_for_statediffs` in infra).
 */
export const ethereumMainnet: NetworkPreset = {
    slug: 'ethereum-mainnet',
    chainId: 1,
    rpc: {...standardValidation},
    method: {},
}
