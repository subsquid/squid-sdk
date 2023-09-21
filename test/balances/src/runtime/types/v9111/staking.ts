import {sts} from '../../pallet.support'
import {Percent, MultiAddress, AccountId32, RewardDestination} from './types'

/**
 * Remove any unlocked chunks from the `unlocking` queue from our management.
 * 
 * This essentially frees up that balance to be used by the stash account to do
 * whatever it wants.
 * 
 * The dispatch origin for this call must be _Signed_ by the controller.
 * 
 * Emits `Withdrawn`.
 * 
 * See also [`Call::unbond`].
 * 
 * # <weight>
 * Complexity O(S) where S is the number of slashing spans to remove
 * NOTE: Weight annotation is the kill scenario, we refund otherwise.
 * # </weight>
 */
export type StakingWithdrawUnbondedCall = {
    numSlashingSpans: number,
}

export const StakingWithdrawUnbondedCall: sts.Type<StakingWithdrawUnbondedCall> = sts.struct(() => {
    return  {
        numSlashingSpans: sts.number(),
    }
})

/**
 * Update the various staking limits this pallet.
 * 
 * * `min_nominator_bond`: The minimum active bond needed to be a nominator.
 * * `min_validator_bond`: The minimum active bond needed to be a validator.
 * * `max_nominator_count`: The max number of users who can be a nominator at once. When
 *   set to `None`, no limit is enforced.
 * * `max_validator_count`: The max number of users who can be a validator at once. When
 *   set to `None`, no limit is enforced.
 * 
 * Origin must be Root to call this function.
 * 
 * NOTE: Existing nominators and validators will not be affected by this update.
 * to kick people under the new limits, `chill_other` should be called.
 */
export type StakingSetStakingLimitsCall = {
    minNominatorBond: bigint,
    minValidatorBond: bigint,
    maxNominatorCount?: (number | undefined),
    maxValidatorCount?: (number | undefined),
    threshold?: (Percent | undefined),
}

export const StakingSetStakingLimitsCall: sts.Type<StakingSetStakingLimitsCall> = sts.struct(() => {
    return  {
        minNominatorBond: sts.bigint(),
        minValidatorBond: sts.bigint(),
        maxNominatorCount: sts.option(() => sts.number()),
        maxValidatorCount: sts.option(() => sts.number()),
        threshold: sts.option(() => Percent),
    }
})

/**
 * Set `HistoryDepth` value. This function will delete any history information
 * when `HistoryDepth` is reduced.
 * 
 * Parameters:
 * - `new_history_depth`: The new history depth you would like to set.
 * - `era_items_deleted`: The number of items that will be deleted by this dispatch. This
 *   should report all the storage items that will be deleted by clearing old era history.
 *   Needed to report an accurate weight for the dispatch. Trusted by `Root` to report an
 *   accurate number.
 * 
 * Origin must be root.
 * 
 * # <weight>
 * - E: Number of history depths removed, i.e. 10 -> 7 = 3
 * - Weight: O(E)
 * - DB Weight:
 *     - Reads: Current Era, History Depth
 *     - Writes: History Depth
 *     - Clear Prefix Each: Era Stakers, EraStakersClipped, ErasValidatorPrefs
 *     - Writes Each: ErasValidatorReward, ErasRewardPoints, ErasTotalStake,
 *       ErasStartSessionIndex
 * # </weight>
 */
export type StakingSetHistoryDepthCall = {
    newHistoryDepth: number,
    eraItemsDeleted: number,
}

export const StakingSetHistoryDepthCall: sts.Type<StakingSetHistoryDepthCall> = sts.struct(() => {
    return  {
        newHistoryDepth: sts.number(),
        eraItemsDeleted: sts.number(),
    }
})

/**
 * (Re-)set the controller of a stash.
 * 
 * Effects will be felt at the beginning of the next era.
 * 
 * The dispatch origin for this call must be _Signed_ by the stash, not the controller.
 * 
 * # <weight>
 * - Independent of the arguments. Insignificant complexity.
 * - Contains a limited number of reads.
 * - Writes are limited to the `origin` account key.
 * ----------
 * Weight: O(1)
 * DB Weight:
 * - Read: Bonded, Ledger New Controller, Ledger Old Controller
 * - Write: Bonded, Ledger New Controller, Ledger Old Controller
 * # </weight>
 */
export type StakingSetControllerCall = {
    controller: MultiAddress,
}

export const StakingSetControllerCall: sts.Type<StakingSetControllerCall> = sts.struct(() => {
    return  {
        controller: MultiAddress,
    }
})

/**
 * Remove all data structure concerning a staker/stash once its balance is at the minimum.
 * This is essentially equivalent to `withdraw_unbonded` except it can be called by anyone
 * and the target `stash` must have no funds left beyond the ED.
 * 
 * This can be called from any origin.
 * 
 * - `stash`: The stash account to reap. Its balance must be zero.
 * 
 * # <weight>
 * Complexity: O(S) where S is the number of slashing spans on the account.
 * DB Weight:
 * - Reads: Stash Account, Bonded, Slashing Spans, Locks
 * - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators,
 *   Stash Account, Locks
 * - Writes Each: SpanSlash * S
 * # </weight>
 */
export type StakingReapStashCall = {
    stash: AccountId32,
    numSlashingSpans: number,
}

export const StakingReapStashCall: sts.Type<StakingReapStashCall> = sts.struct(() => {
    return  {
        stash: AccountId32,
        numSlashingSpans: sts.number(),
    }
})

/**
 * Pay out all the stakers behind a single validator for a single era.
 * 
 * - `validator_stash` is the stash account of the validator. Their nominators, up to
 *   `T::MaxNominatorRewardedPerValidator`, will also receive their rewards.
 * - `era` may be any era between `[current_era - history_depth; current_era]`.
 * 
 * The origin of this call must be _Signed_. Any account can call this function, even if
 * it is not one of the stakers.
 * 
 * # <weight>
 * - Time complexity: at most O(MaxNominatorRewardedPerValidator).
 * - Contains a limited number of reads and writes.
 * -----------
 * N is the Number of payouts for the validator (including the validator)
 * Weight:
 * - Reward Destination Staked: O(N)
 * - Reward Destination Controller (Creating): O(N)
 * 
 *   NOTE: weights are assuming that payouts are made to alive stash account (Staked).
 *   Paying even a dead controller is cheaper weight-wise. We don't do any refunds here.
 * # </weight>
 */
export type StakingPayoutStakersCall = {
    validatorStash: AccountId32,
    era: number,
}

export const StakingPayoutStakersCall: sts.Type<StakingPayoutStakersCall> = sts.struct(() => {
    return  {
        validatorStash: AccountId32,
        era: sts.number(),
    }
})

/**
 * Declare the desire to nominate `targets` for the origin controller.
 * 
 * Effects will be felt at the beginning of the next era.
 * 
 * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 * # <weight>
 * - The transaction's complexity is proportional to the size of `targets` (N)
 * which is capped at CompactAssignments::LIMIT (MAX_NOMINATIONS).
 * - Both the reads and writes follow a similar pattern.
 * # </weight>
 */
export type StakingNominateCall = {
    targets: MultiAddress[],
}

export const StakingNominateCall: sts.Type<StakingNominateCall> = sts.struct(() => {
    return  {
        targets: sts.array(() => MultiAddress),
    }
})

/**
 * Remove the given nominations from the calling validator.
 * 
 * Effects will be felt at the beginning of the next era.
 * 
 * The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 * - `who`: A list of nominator stash accounts who are nominating this validator which
 *   should no longer be nominating this validator.
 * 
 * Note: Making this call only makes sense if you first set the validator preferences to
 * block any further nominations.
 */
export type StakingKickCall = {
    who: MultiAddress[],
}

export const StakingKickCall: sts.Type<StakingKickCall> = sts.struct(() => {
    return  {
        who: sts.array(() => MultiAddress),
    }
})

/**
 * Force a current staker to become completely unstaked, immediately.
 * 
 * The dispatch origin must be Root.
 * 
 * # <weight>
 * O(S) where S is the number of slashing spans to be removed
 * Reads: Bonded, Slashing Spans, Account, Locks
 * Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators,
 * Account, Locks Writes Each: SpanSlash * S
 * # </weight>
 */
export type StakingForceUnstakeCall = {
    stash: AccountId32,
    numSlashingSpans: number,
}

export const StakingForceUnstakeCall: sts.Type<StakingForceUnstakeCall> = sts.struct(() => {
    return  {
        stash: AccountId32,
        numSlashingSpans: sts.number(),
    }
})

/**
 * Cancel enactment of a deferred slash.
 * 
 * Can be called by the `T::SlashCancelOrigin`.
 * 
 * Parameters: era and indices of the slashes for that era to kill.
 * 
 * # <weight>
 * Complexity: O(U + S)
 * with U unapplied slashes weighted with U=1000
 * and S is the number of slash indices to be canceled.
 * - Read: Unapplied Slashes
 * - Write: Unapplied Slashes
 * # </weight>
 */
export type StakingCancelDeferredSlashCall = {
    era: number,
    slashIndices: number[],
}

export const StakingCancelDeferredSlashCall: sts.Type<StakingCancelDeferredSlashCall> = sts.struct(() => {
    return  {
        era: sts.number(),
        slashIndices: sts.array(() => sts.number()),
    }
})

/**
 * Add some extra amount that have appeared in the stash `free_balance` into the balance up
 * for staking.
 * 
 * The dispatch origin for this call must be _Signed_ by the stash, not the controller.
 * 
 * Use this if there are additional funds in your stash account that you wish to bond.
 * Unlike [`bond`](Self::bond) or [`unbond`](Self::unbond) this function does not impose
 * any limitation on the amount that can be added.
 * 
 * Emits `Bonded`.
 * 
 * # <weight>
 * - Independent of the arguments. Insignificant complexity.
 * - O(1).
 * # </weight>
 */
export type StakingBondExtraCall = {
    maxAdditional: bigint,
}

export const StakingBondExtraCall: sts.Type<StakingBondExtraCall> = sts.struct(() => {
    return  {
        maxAdditional: sts.bigint(),
    }
})

/**
 * Take the origin account as a stash and lock up `value` of its balance. `controller` will
 * be the account that controls it.
 * 
 * `value` must be more than the `minimum_balance` specified by `T::Currency`.
 * 
 * The dispatch origin for this call must be _Signed_ by the stash account.
 * 
 * Emits `Bonded`.
 * # <weight>
 * - Independent of the arguments. Moderate complexity.
 * - O(1).
 * - Three extra DB entries.
 * 
 * NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned
 * unless the `origin` falls below _existential deposit_ and gets removed as dust.
 * ------------------
 * # </weight>
 */
export type StakingBondCall = {
    controller: MultiAddress,
    value: bigint,
    payee: RewardDestination,
}

export const StakingBondCall: sts.Type<StakingBondCall> = sts.struct(() => {
    return  {
        controller: MultiAddress,
        value: sts.bigint(),
        payee: RewardDestination,
    }
})
