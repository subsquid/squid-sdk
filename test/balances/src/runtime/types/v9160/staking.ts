import {sts} from '../../pallet.support'
import {Percent, Perbill} from './types'

/**
 * Update the various staking configurations .
 * 
 * * `min_nominator_bond`: The minimum active bond needed to be a nominator.
 * * `min_validator_bond`: The minimum active bond needed to be a validator.
 * * `max_nominator_count`: The max number of users who can be a nominator at once. When
 *   set to `None`, no limit is enforced.
 * * `max_validator_count`: The max number of users who can be a validator at once. When
 *   set to `None`, no limit is enforced.
 * * `chill_threshold`: The ratio of `max_nominator_count` or `max_validator_count` which
 *   should be filled in order for the `chill_other` transaction to work.
 * * `min_commission`: The minimum amount of commission that each validators must maintain.
 *   This is checked only upon calling `validate`. Existing validators are not affected.
 * 
 * Origin must be Root to call this function.
 * 
 * NOTE: Existing nominators and validators will not be affected by this update.
 * to kick people under the new limits, `chill_other` should be called.
 */
export type StakingSetStakingConfigsCall = {
    minNominatorBond: bigint,
    minValidatorBond: bigint,
    maxNominatorCount?: (number | undefined),
    maxValidatorCount?: (number | undefined),
    chillThreshold?: (Percent | undefined),
    minCommission: Perbill,
}

export const StakingSetStakingConfigsCall: sts.Type<StakingSetStakingConfigsCall> = sts.struct(() => {
    return  {
        minNominatorBond: sts.bigint(),
        minValidatorBond: sts.bigint(),
        maxNominatorCount: sts.option(() => sts.number()),
        maxValidatorCount: sts.option(() => sts.number()),
        chillThreshold: sts.option(() => Percent),
        minCommission: Perbill,
    }
})
