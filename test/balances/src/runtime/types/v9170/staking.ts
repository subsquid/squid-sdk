import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Force a validator to have at least the minimum commission. This will not affect a
 * validator who already has a commission greater than or equal to the minimum. Any account
 * can call this.
 */
export type StakingForceApplyMinCommissionCall = {
    validatorStash: AccountId32,
}

export const StakingForceApplyMinCommissionCall: sts.Type<StakingForceApplyMinCommissionCall> = sts.struct(() => {
    return  {
        validatorStash: AccountId32,
    }
})
