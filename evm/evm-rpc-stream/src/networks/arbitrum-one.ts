import {standardValidation} from './_families'
import {NetworkPreset} from './types'

/** Arbitrum One: full validation; the dataset carries traces but not state diffs. */
export const arbitrumOne: NetworkPreset = {
    slug: 'arbitrum-one',
    chainId: 42161,
    family: 'arbitrum',
    rpc: {...standardValidation},
    method: {},
}
