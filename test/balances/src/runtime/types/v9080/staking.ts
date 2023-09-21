import {sts} from '../../pallet.support'
import {BalanceOf, Percent} from './types'

/**
 *  Update the various staking limits this pallet.
 * 
 *  * `min_nominator_bond`: The minimum active bond needed to be a nominator.
 *  * `min_validator_bond`: The minimum active bond needed to be a validator.
 *  * `max_nominator_count`: The max number of users who can be a nominator at once.
 *    When set to `None`, no limit is enforced.
 *  * `max_validator_count`: The max number of users who can be a validator at once.
 *    When set to `None`, no limit is enforced.
 * 
 *  Origin must be Root to call this function.
 * 
 *  NOTE: Existing nominators and validators will not be affected by this update.
 *  to kick people under the new limits, `chill_other` should be called.
 */
export type StakingSetStakingLimitsCall = {
    min_nominator_bond: BalanceOf,
    min_validator_bond: BalanceOf,
    max_nominator_count?: (number | undefined),
    max_validator_count?: (number | undefined),
    threshold?: (Percent | undefined),
}

export const StakingSetStakingLimitsCall: sts.Type<StakingSetStakingLimitsCall> = sts.struct(() => {
    return  {
        min_nominator_bond: BalanceOf,
        min_validator_bond: BalanceOf,
        max_nominator_count: sts.option(() => sts.number()),
        max_validator_count: sts.option(() => sts.number()),
        threshold: sts.option(() => Percent),
    }
})
