import {opStackMethod, standardValidation} from './_families'
import {NetworkPreset} from './types'

/** Optimism mainnet (OP-stack): full validation; state diffs via the debug `prestateTracer`. */
export const optimismMainnet: NetworkPreset = {
    slug: 'optimism-mainnet',
    chainId: 10,
    family: 'op-stack',
    rpc: {...standardValidation},
    method: {...opStackMethod},
}
