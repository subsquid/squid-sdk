import {opStackMethod, standardValidation} from './_families'
import {NetworkPreset} from './types'

/** Base mainnet (OP-stack): full validation; state diffs via the debug `prestateTracer`. */
export const baseMainnet: NetworkPreset = {
    slug: 'base-mainnet',
    chainId: 8453,
    family: 'op-stack',
    rpc: {...standardValidation},
    method: {...opStackMethod},
}
