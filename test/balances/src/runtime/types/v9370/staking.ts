import {sts} from '../../pallet.support'
import {Perbill, Forcing} from './types'

/**
 * Sets the minimum amount of commission that each validators must maintain.
 * 
 * This call has lower privilege requirements than `set_staking_config` and can be called
 * by the `T::AdminOrigin`. Root can always call this.
 */
export type StakingSetMinCommissionCall = {
    new: Perbill,
}

export const StakingSetMinCommissionCall: sts.Type<StakingSetMinCommissionCall> = sts.struct(() => {
    return  {
        new: Perbill,
    }
})

/**
 * A new force era mode was set.
 */
export type StakingForceEraEvent = {
    mode: Forcing,
}

export const StakingForceEraEvent: sts.Type<StakingForceEraEvent> = sts.struct(() => {
    return  {
        mode: Forcing,
    }
})
