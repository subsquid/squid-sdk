import {sts} from '../../pallet.support'
import {ValidatorPrefs, RewardDestination, AccountId, LookupSource, EraIndex, Balance, SessionIndex} from './types'

/**
 *  Remove any unlocked chunks from the `unlocking` queue from our management.
 * 
 *  This essentially frees up that balance to be used by the stash account to do
 *  whatever it wants.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  See also [`Call::unbond`].
 * 
 *  # <weight>
 *  - Could be dependent on the `origin` argument and how much `unlocking` chunks exist.
 *   It implies `consolidate_unlocked` which loops over `Ledger.unlocking`, which is
 *   indirectly user-controlled. See [`unbond`] for more detail.
 *  - Contains a limited number of reads, yet the size of which could be large based on `ledger`.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export type StakingWithdrawUnbondedCall = null

export const StakingWithdrawUnbondedCall: sts.Type<StakingWithdrawUnbondedCall> = sts.unit()

/**
 *  Declare the desire to validate for the origin controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export type StakingValidateCall = {
    prefs: ValidatorPrefs,
}

export const StakingValidateCall: sts.Type<StakingValidateCall> = sts.struct(() => {
    return  {
        prefs: ValidatorPrefs,
    }
})

/**
 *  Schedule a portion of the stash to be unlocked ready for transfer out after the bond
 *  period ends. If this leaves an amount actively bonded less than
 *  T::Currency::minimum_balance(), then it is increased to the full amount.
 * 
 *  Once the unlock period is done, you can call `withdraw_unbonded` to actually move
 *  the funds out of management ready for transfer.
 * 
 *  No more than a limited number of unlocking chunks (see `MAX_UNLOCKING_CHUNKS`)
 *  can co-exists at the same time. In that case, [`Call::withdraw_unbonded`] need
 *  to be called first to remove some of the chunks (if possible).
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  See also [`Call::withdraw_unbonded`].
 * 
 *  # <weight>
 *  - Independent of the arguments. Limited but potentially exploitable complexity.
 *  - Contains a limited number of reads.
 *  - Each call (requires the remainder of the bonded balance to be above `minimum_balance`)
 *    will cause a new entry to be inserted into a vector (`Ledger.unlocking`) kept in storage.
 *    The only way to clean the aforementioned storage item is also user-controlled via `withdraw_unbonded`.
 *  - One DB entry.
 *  </weight>
 */
export type StakingUnbondCall = {
    value: bigint,
}

export const StakingUnbondCall: sts.Type<StakingUnbondCall> = sts.struct(() => {
    return  {
        value: sts.bigint(),
    }
})

/**
 *  The ideal number of validators.
 */
export type StakingSetValidatorCountCall = {
    new: number,
}

export const StakingSetValidatorCountCall: sts.Type<StakingSetValidatorCountCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})

/**
 *  (Re-)set the payment target for a controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export type StakingSetPayeeCall = {
    payee: RewardDestination,
}

export const StakingSetPayeeCall: sts.Type<StakingSetPayeeCall> = sts.struct(() => {
    return  {
        payee: RewardDestination,
    }
})

/**
 *  Set the validators who cannot be slashed (if any).
 */
export type StakingSetInvulnerablesCall = {
    validators: AccountId[],
}

export const StakingSetInvulnerablesCall: sts.Type<StakingSetInvulnerablesCall> = sts.struct(() => {
    return  {
        validators: sts.array(() => AccountId),
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
 *  Force a current staker to become completely unstaked, immediately.
 */
export type StakingForceUnstakeCall = {
    stash: AccountId,
}

export const StakingForceUnstakeCall: sts.Type<StakingForceUnstakeCall> = sts.struct(() => {
    return  {
        stash: AccountId,
    }
})

/**
 *  Force there to be no new eras indefinitely.
 * 
 *  # <weight>
 *  - No arguments.
 *  # </weight>
 */
export type StakingForceNoErasCall = null

export const StakingForceNoErasCall: sts.Type<StakingForceNoErasCall> = sts.unit()

/**
 *  Force there to be a new era at the end of sessions indefinitely.
 * 
 *  # <weight>
 *  - One storage write
 *  # </weight>
 */
export type StakingForceNewEraAlwaysCall = null

export const StakingForceNewEraAlwaysCall: sts.Type<StakingForceNewEraAlwaysCall> = sts.unit()

/**
 *  Force there to be a new era at the end of the next session. After this, it will be
 *  reset to normal (non-forced) behaviour.
 * 
 *  # <weight>
 *  - No arguments.
 *  # </weight>
 */
export type StakingForceNewEraCall = null

export const StakingForceNewEraCall: sts.Type<StakingForceNewEraCall> = sts.unit()

/**
 *  Declare no desire to either validate or nominate.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains one read.
 *  - Writes are limited to the `origin` account key.
 *  # </weight>
 */
export type StakingChillCall = null

export const StakingChillCall: sts.Type<StakingChillCall> = sts.unit()

/**
 *  Cancel enactment of a deferred slash. Can be called by either the root origin or
 *  the `T::SlashCancelOrigin`.
 *  passing the era and indices of the slashes for that era to kill.
 * 
 *  # <weight>
 *  - One storage write.
 *  # </weight>
 */
export type StakingCancelDeferredSlashCall = {
    era: EraIndex,
    slash_indices: number[],
}

export const StakingCancelDeferredSlashCall: sts.Type<StakingCancelDeferredSlashCall> = sts.struct(() => {
    return  {
        era: EraIndex,
        slash_indices: sts.array(() => sts.number()),
    }
})

/**
 *  Add some extra amount that have appeared in the stash `free_balance` into the balance up
 *  for staking.
 * 
 *  Use this if there are additional funds in your stash account that you wish to bond.
 *  Unlike [`bond`] or [`unbond`] this function does not impose any limitation on the amount
 *  that can be added.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash, not the controller.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - O(1).
 *  - One DB entry.
 *  # </weight>
 */
export type StakingBondExtraCall = {
    max_additional: bigint,
}

export const StakingBondExtraCall: sts.Type<StakingBondExtraCall> = sts.struct(() => {
    return  {
        max_additional: sts.bigint(),
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
 *  One validator (and its nominators) has been slashed by the given amount.
 */
export type StakingSlashEvent = [AccountId, Balance]

export const StakingSlashEvent: sts.Type<StakingSlashEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  All validators have been rewarded by the first balance; the second is the remainder
 *  from the maximum amount of reward.
 */
export type StakingRewardEvent = [Balance, Balance]

export const StakingRewardEvent: sts.Type<StakingRewardEvent> = sts.tuple(() => Balance, Balance)

/**
 *  An old slashing report from a prior era was discarded because it could
 *  not be processed.
 */
export type StakingOldSlashingReportDiscardedEvent = [SessionIndex]

export const StakingOldSlashingReportDiscardedEvent: sts.Type<StakingOldSlashingReportDiscardedEvent> = sts.tuple(() => SessionIndex)
