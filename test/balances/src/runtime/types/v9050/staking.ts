import {sts} from '../../pallet.support'
import {BalanceOf, AccountId} from './types'

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
export type StakingUpdateStakingLimitsCall = {
    min_nominator_bond: BalanceOf,
    min_validator_bond: BalanceOf,
    max_nominator_count?: (number | undefined),
    max_validator_count?: (number | undefined),
}

export const StakingUpdateStakingLimitsCall: sts.Type<StakingUpdateStakingLimitsCall> = sts.struct(() => {
    return  {
        min_nominator_bond: BalanceOf,
        min_validator_bond: BalanceOf,
        max_nominator_count: sts.option(() => sts.number()),
        max_validator_count: sts.option(() => sts.number()),
    }
})

/**
 *  Declare a `controller` as having no desire to either validator or nominate.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_, but can be called by anyone.
 * 
 *  If the caller is the same as the controller being targeted, then no further checks
 *  are enforced. However, this call can also be made by an third party user who witnesses
 *  that this controller does not satisfy the minimum bond requirements to be in their role.
 * 
 *  This can be helpful if bond requirements are updated, and we need to remove old users
 *  who do not satisfy these requirements.
 * 
 */
export type StakingChillOtherCall = {
    controller: AccountId,
}

export const StakingChillOtherCall: sts.Type<StakingChillOtherCall> = sts.struct(() => {
    return  {
        controller: AccountId,
    }
})

/**
 *  The election failed. No new era is planned.
 */
export type StakingStakingElectionFailedEvent = null

export const StakingStakingElectionFailedEvent: sts.Type<StakingStakingElectionFailedEvent> = sts.unit()
