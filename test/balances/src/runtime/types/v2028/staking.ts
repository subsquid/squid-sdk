import {sts} from '../../pallet.support'
import {ValidatorPrefs, LookupSource, RewardDestination, AccountId} from './types'

/**
 *  Declare the desire to validate for the origin controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  -----------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: Era Election Status, Ledger
 *  - Write: Nominators, Validators
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
 *  ----------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: Bonded, Ledger New Controller, Ledger Old Controller
 *  - Write: Bonded, Ledger New Controller, Ledger Old Controller
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
 *  Effects will be felt at the beginning of the next era. This can only be called when
 *  [`EraElectionStatus`] is `Closed`.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - The transaction's complexity is proportional to the size of `targets` (N)
 *  which is capped at CompactAssignments::LIMIT (MAX_NOMINATIONS).
 *  - Both the reads and writes follow a similar pattern.
 *  ---------
 *  Weight: O(N)
 *  where N is the number of targets
 *  DB Weight:
 *  - Reads: Era Election Status, Ledger, Current Era
 *  - Writes: Validators, Nominators
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
 *  Remove the given nominations from the calling validator.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`. The controller
 *  account should represent a validator.
 * 
 *  - `who`: A list of nominator stash accounts who are nominating this validator which
 *    should no longer be nominating this validator.
 * 
 *  Note: Making this call only makes sense if you first set the validator preferences to
 *  block any further nominations.
 */
export type StakingKickCall = {
    who: LookupSource[],
}

export const StakingKickCall: sts.Type<StakingKickCall> = sts.struct(() => {
    return  {
        who: sts.array(() => LookupSource),
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
 *  Emits `Bonded`.
 * 
 *  # <weight>
 *  - Independent of the arguments. Moderate complexity.
 *  - O(1).
 *  - Three extra DB entries.
 * 
 *  NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned
 *  unless the `origin` falls below _existential deposit_ and gets removed as dust.
 *  ------------------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: Bonded, Ledger, [Origin Account], Current Era, History Depth, Locks
 *  - Write: Bonded, Payee, [Origin Account], Locks, Ledger
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
 *  A nominator has been kicked from a validator. \[nominator, stash\]
 */
export type StakingKickedEvent = [AccountId, AccountId]

export const StakingKickedEvent: sts.Type<StakingKickedEvent> = sts.tuple(() => AccountId, AccountId)
