import {sts} from '../../pallet.support'
import {LookupSource, AccountId, EraIndex, RewardDestination, Balance} from './types'

/**
 *  Set history_depth value.
 * 
 *  Origin must be root.
 */
export type StakingSetHistoryDepthCall = {
    new_history_depth: number,
}

export const StakingSetHistoryDepthCall: sts.Type<StakingSetHistoryDepthCall> = sts.struct(() => {
    return  {
        new_history_depth: sts.number(),
    }
})

/**
 *  (Re-)set the controller of a stash.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash, not the controller.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export type StakingSetControllerCall = {
    controller: LookupSource,
}

export const StakingSetControllerCall: sts.Type<StakingSetControllerCall> = sts.struct(() => {
    return  {
        controller: LookupSource,
    }
})

/**
 *  Remove all data structure concerning a staker/stash once its balance is zero.
 *  This is essentially equivalent to `withdraw_unbonded` except it can be called by anyone
 *  and the target `stash` must have no funds left.
 * 
 *  This can be called from any origin.
 * 
 *  - `stash`: The stash account to reap. Its balance must be zero.
 */
export type StakingReapStashCall = {
    stash: AccountId,
}

export const StakingReapStashCall: sts.Type<StakingReapStashCall> = sts.struct(() => {
    return  {
        stash: AccountId,
    }
})

/**
 *  Make one validator's payout for one era.
 * 
 *  - `who` is the controller account of the validator to pay out.
 *  - `era` may not be lower than one following the most recently paid era. If it is higher,
 *    then it indicates an instruction to skip the payout of all previous eras.
 * 
 *  WARNING: once an era is payed for a validator such validator can't claim the payout of
 *  previous era.
 * 
 *  WARNING: Incorrect arguments here can result in loss of payout. Be very careful.
 * 
 *  # <weight>
 *  - Time complexity: O(1).
 *  - Contains a limited number of reads and writes.
 *  # </weight>
 */
export type StakingPayoutValidatorCall = {
    era: EraIndex,
}

export const StakingPayoutValidatorCall: sts.Type<StakingPayoutValidatorCall> = sts.struct(() => {
    return  {
        era: EraIndex,
    }
})

/**
 *  Make one nominator's payout for one era.
 * 
 *  - `who` is the controller account of the nominator to pay out.
 *  - `era` may not be lower than one following the most recently paid era. If it is higher,
 *    then it indicates an instruction to skip the payout of all previous eras.
 *  - `validators` is the list of all validators that `who` had exposure to during `era`.
 *    If it is incomplete, then less than the full reward will be paid out.
 *    It must not exceed `MAX_NOMINATIONS`.
 * 
 *  WARNING: once an era is payed for a validator such validator can't claim the payout of
 *  previous era.
 * 
 *  WARNING: Incorrect arguments here can result in loss of payout. Be very careful.
 * 
 *  # <weight>
 *  - Number of storage read of `O(validators)`; `validators` is the argument of the call,
 *    and is bounded by `MAX_NOMINATIONS`.
 *  - Each storage read is `O(N)` size and decode complexity; `N` is the  maximum
 *    nominations that can be given to a single validator.
 *  - Computation complexity: `O(MAX_NOMINATIONS * logN)`; `MAX_NOMINATIONS` is the
 *    maximum number of validators that may be nominated by a single nominator, it is
 *    bounded only economically (all nominators are required to place a minimum stake).
 *  # </weight>
 */
export type StakingPayoutNominatorCall = {
    era: EraIndex,
    validators: [AccountId, number][],
}

export const StakingPayoutNominatorCall: sts.Type<StakingPayoutNominatorCall> = sts.struct(() => {
    return  {
        era: EraIndex,
        validators: sts.array(() => sts.tuple(() => AccountId, sts.number())),
    }
})

/**
 *  Declare the desire to nominate `targets` for the origin controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - The transaction's complexity is proportional to the size of `targets`,
 *  which is capped at `MAX_NOMINATIONS`.
 *  - Both the reads and writes follow a similar pattern.
 *  # </weight>
 */
export type StakingNominateCall = {
    targets: LookupSource[],
}

export const StakingNominateCall: sts.Type<StakingNominateCall> = sts.struct(() => {
    return  {
        targets: sts.array(() => LookupSource),
    }
})

/**
 *  Take the origin account as a stash and lock up `value` of its balance. `controller` will
 *  be the account that controls it.
 * 
 *  `value` must be more than the `minimum_balance` specified by `T::Currency`.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash account.
 * 
 *  # <weight>
 *  - Independent of the arguments. Moderate complexity.
 *  - O(1).
 *  - Three extra DB entries.
 * 
 *  NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned unless
 *  the `origin` falls below _existential deposit_ and gets removed as dust.
 *  # </weight>
 */
export type StakingBondCall = {
    controller: LookupSource,
    value: bigint,
    payee: RewardDestination,
}

export const StakingBondCall: sts.Type<StakingBondCall> = sts.struct(() => {
    return  {
        controller: LookupSource,
        value: sts.bigint(),
        payee: RewardDestination,
    }
})

/**
 *  The staker has been rewarded by this amount. AccountId is controller account.
 */
export type StakingRewardEvent = [AccountId, Balance]

export const StakingRewardEvent: sts.Type<StakingRewardEvent> = sts.tuple(() => AccountId, Balance)
