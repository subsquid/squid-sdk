import {sts} from '../../pallet.support'
import {ValidatorIndex, CompactAssignments, ElectionScore, EraIndex, ElectionSize, AccountId, ElectionCompute} from './types'

/**
 *  Remove any unlocked chunks from the `unlocking` queue from our management.
 * 
 *  This essentially frees up that balance to be used by the stash account to do
 *  whatever it wants.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  Emits `Withdrawn`.
 * 
 *  See also [`Call::unbond`].
 * 
 *  # <weight>
 *  - Could be dependent on the `origin` argument and how much `unlocking` chunks exist.
 *   It implies `consolidate_unlocked` which loops over `Ledger.unlocking`, which is
 *   indirectly user-controlled. See [`unbond`] for more detail.
 *  - Contains a limited number of reads, yet the size of which could be large based on `ledger`.
 *  - Writes are limited to the `origin` account key.
 *  ---------------
 *  Complexity O(S) where S is the number of slashing spans to remove
 *  Base Weight:
 *  Update: 50.52 + .028 * S µs
 *  - Reads: EraElectionStatus, Ledger, Current Era, Locks, [Origin Account]
 *  - Writes: [Origin Account], Locks, Ledger
 *  Kill: 79.41 + 2.366 * S µs
 *  - Reads: EraElectionStatus, Ledger, Current Era, Bonded, Slashing Spans, [Origin Account], Locks
 *  - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, [Origin Account], Locks
 *  - Writes Each: SpanSlash * S
 *  NOTE: Weight annotation is the kill scenario, we refund otherwise.
 *  # </weight>
 */
export type StakingWithdrawUnbondedCall = {
    num_slashing_spans: number,
}

export const StakingWithdrawUnbondedCall: sts.Type<StakingWithdrawUnbondedCall> = sts.struct(() => {
    return  {
        num_slashing_spans: sts.number(),
    }
})

/**
 *  Unsigned version of `submit_election_solution`.
 * 
 *  Note that this must pass the [`ValidateUnsigned`] check which only allows transactions
 *  from the local node to be included. In other words, only the block author can include a
 *  transaction in the block.
 * 
 *  # <weight>
 *  See `crate::weight` module.
 *  # </weight>
 */
export type StakingSubmitElectionSolutionUnsignedCall = {
    winners: ValidatorIndex[],
    compact: CompactAssignments,
    score: ElectionScore,
    era: EraIndex,
    size: ElectionSize,
}

export const StakingSubmitElectionSolutionUnsignedCall: sts.Type<StakingSubmitElectionSolutionUnsignedCall> = sts.struct(() => {
    return  {
        winners: sts.array(() => ValidatorIndex),
        compact: CompactAssignments,
        score: ElectionScore,
        era: EraIndex,
        size: ElectionSize,
    }
})

/**
 *  Submit an election result to the chain. If the solution:
 * 
 *  1. is valid.
 *  2. has a better score than a potentially existing solution on chain.
 * 
 *  then, it will be _put_ on chain.
 * 
 *  A solution consists of two pieces of data:
 * 
 *  1. `winners`: a flat vector of all the winners of the round.
 *  2. `assignments`: the compact version of an assignment vector that encodes the edge
 *     weights.
 * 
 *  Both of which may be computed using _phragmen_, or any other algorithm.
 * 
 *  Additionally, the submitter must provide:
 * 
 *  - The `score` that they claim their solution has.
 * 
 *  Both validators and nominators will be represented by indices in the solution. The
 *  indices should respect the corresponding types ([`ValidatorIndex`] and
 *  [`NominatorIndex`]). Moreover, they should be valid when used to index into
 *  [`SnapshotValidators`] and [`SnapshotNominators`]. Any invalid index will cause the
 *  solution to be rejected. These two storage items are set during the election window and
 *  may be used to determine the indices.
 * 
 *  A solution is valid if:
 * 
 *  0. It is submitted when [`EraElectionStatus`] is `Open`.
 *  1. Its claimed score is equal to the score computed on-chain.
 *  2. Presents the correct number of winners.
 *  3. All indexes must be value according to the snapshot vectors. All edge values must
 *     also be correct and should not overflow the granularity of the ratio type (i.e. 256
 *     or billion).
 *  4. For each edge, all targets are actually nominated by the voter.
 *  5. Has correct self-votes.
 * 
 *  A solutions score is consisted of 3 parameters:
 * 
 *  1. `min { support.total }` for each support of a winner. This value should be maximized.
 *  2. `sum { support.total }` for each support of a winner. This value should be minimized.
 *  3. `sum { support.total^2 }` for each support of a winner. This value should be
 *     minimized (to ensure less variance)
 * 
 *  # <weight>
 *  See `crate::weight` module.
 *  # </weight>
 */
export type StakingSubmitElectionSolutionCall = {
    winners: ValidatorIndex[],
    compact: CompactAssignments,
    score: ElectionScore,
    era: EraIndex,
    size: ElectionSize,
}

export const StakingSubmitElectionSolutionCall: sts.Type<StakingSubmitElectionSolutionCall> = sts.struct(() => {
    return  {
        winners: sts.array(() => ValidatorIndex),
        compact: CompactAssignments,
        score: ElectionScore,
        era: EraIndex,
        size: ElectionSize,
    }
})

/**
 *  Set `HistoryDepth` value. This function will delete any history information
 *  when `HistoryDepth` is reduced.
 * 
 *  Parameters:
 *  - `new_history_depth`: The new history depth you would like to set.
 *  - `era_items_deleted`: The number of items that will be deleted by this dispatch.
 *     This should report all the storage items that will be deleted by clearing old
 *     era history. Needed to report an accurate weight for the dispatch. Trusted by
 *     `Root` to report an accurate number.
 * 
 *  Origin must be root.
 * 
 *  # <weight>
 *  - E: Number of history depths removed, i.e. 10 -> 7 = 3
 *  - Base Weight: 29.13 * E µs
 *  - DB Weight:
 *      - Reads: Current Era, History Depth
 *      - Writes: History Depth
 *      - Clear Prefix Each: Era Stakers, EraStakersClipped, ErasValidatorPrefs
 *      - Writes Each: ErasValidatorReward, ErasRewardPoints, ErasTotalStake, ErasStartSessionIndex
 *  # </weight>
 */
export type StakingSetHistoryDepthCall = {
    new_history_depth: number,
    _era_items_deleted: number,
}

export const StakingSetHistoryDepthCall: sts.Type<StakingSetHistoryDepthCall> = sts.struct(() => {
    return  {
        new_history_depth: sts.number(),
        _era_items_deleted: sts.number(),
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
 * 
 *  # <weight>
 *  Complexity: O(S) where S is the number of slashing spans on the account.
 *  Base Weight: 75.94 + 2.396 * S µs
 *  DB Weight:
 *  - Reads: Stash Account, Bonded, Slashing Spans, Locks
 *  - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Stash Account, Locks
 *  - Writes Each: SpanSlash * S
 *  # </weight>
 */
export type StakingReapStashCall = {
    stash: AccountId,
    num_slashing_spans: number,
}

export const StakingReapStashCall: sts.Type<StakingReapStashCall> = sts.struct(() => {
    return  {
        stash: AccountId,
        num_slashing_spans: sts.number(),
    }
})

/**
 *  Force a current staker to become completely unstaked, immediately.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  O(S) where S is the number of slashing spans to be removed
 *  Base Weight: 53.07 + 2.365 * S µs
 *  Reads: Bonded, Slashing Spans, Account, Locks
 *  Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Account, Locks
 *  Writes Each: SpanSlash * S
 *  # </weight>
 */
export type StakingForceUnstakeCall = {
    stash: AccountId,
    num_slashing_spans: number,
}

export const StakingForceUnstakeCall: sts.Type<StakingForceUnstakeCall> = sts.struct(() => {
    return  {
        stash: AccountId,
        num_slashing_spans: sts.number(),
    }
})

/**
 *  A new solution for the upcoming election has been stored.
 */
export type StakingSolutionStoredEvent = [ElectionCompute]

export const StakingSolutionStoredEvent: sts.Type<StakingSolutionStoredEvent> = sts.tuple(() => ElectionCompute)
