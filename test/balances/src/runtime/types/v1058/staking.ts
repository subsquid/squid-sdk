import {sts} from '../../pallet.support'
import {ValidatorIndex, CompactAssignments, PhragmenScore, EraIndex, AccountId, ElectionCompute} from './types'

/**
 *  Unsigned version of `submit_election_solution`.
 * 
 *  Note that this must pass the [`ValidateUnsigned`] check which only allows transactions
 *  from the local node to be included. In other words, only the block author can include a
 *  transaction in the block.
 */
export type StakingSubmitElectionSolutionUnsignedCall = {
    winners: ValidatorIndex[],
    compact_assignments: CompactAssignments,
    score: PhragmenScore,
    era: EraIndex,
}

export const StakingSubmitElectionSolutionUnsignedCall: sts.Type<StakingSubmitElectionSolutionUnsignedCall> = sts.struct(() => {
    return  {
        winners: sts.array(() => ValidatorIndex),
        compact_assignments: CompactAssignments,
        score: PhragmenScore,
        era: EraIndex,
    }
})

/**
 *  Submit a phragmen result to the chain. If the solution:
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
 *  Both of which may be computed using [`phragmen`], or any other algorithm.
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
 *  E: number of edges. m: size of winner committee. n: number of nominators. d: edge degree
 *  (16 for now) v: number of on-chain validator candidates.
 * 
 *  NOTE: given a solution which is reduced, we can enable a new check the ensure `|E| < n +
 *  m`. We don't do this _yet_, but our offchain worker code executes it nonetheless.
 * 
 *  major steps (all done in `check_and_replace_solution`):
 * 
 *  - Storage: O(1) read `ElectionStatus`.
 *  - Storage: O(1) read `PhragmenScore`.
 *  - Storage: O(1) read `ValidatorCount`.
 *  - Storage: O(1) length read from `SnapshotValidators`.
 * 
 *  - Storage: O(v) reads of `AccountId` to fetch `snapshot_validators`.
 *  - Memory: O(m) iterations to map winner index to validator id.
 *  - Storage: O(n) reads `AccountId` to fetch `snapshot_nominators`.
 *  - Memory: O(n + m) reads to map index to `AccountId` for un-compact.
 * 
 *  - Storage: O(e) accountid reads from `Nomination` to read correct nominations.
 *  - Storage: O(e) calls into `slashable_balance_of_vote_weight` to convert ratio to staked.
 * 
 *  - Memory: build_support_map. O(e).
 *  - Memory: evaluate_support: O(E).
 * 
 *  - Storage: O(e) writes to `QueuedElected`.
 *  - Storage: O(1) write to `QueuedScore`
 * 
 *  The weight of this call is 1/10th of the blocks total weight.
 *  # </weight>
 */
export type StakingSubmitElectionSolutionCall = {
    winners: ValidatorIndex[],
    compact_assignments: CompactAssignments,
    score: PhragmenScore,
    era: EraIndex,
}

export const StakingSubmitElectionSolutionCall: sts.Type<StakingSubmitElectionSolutionCall> = sts.struct(() => {
    return  {
        winners: sts.array(() => ValidatorIndex),
        compact_assignments: CompactAssignments,
        score: PhragmenScore,
        era: EraIndex,
    }
})

/**
 *  Pay out all the stakers behind a single validator for a single era.
 * 
 *  - `validator_stash` is the stash account of the validator. Their nominators, up to
 *    `T::MaxNominatorRewardedPerValidator`, will also receive their rewards.
 *  - `era` may be any era between `[current_era - history_depth; current_era]`.
 * 
 *  The origin of this call must be _Signed_. Any account can call this function, even if
 *  it is not one of the stakers.
 * 
 *  This can only be called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Time complexity: at most O(MaxNominatorRewardedPerValidator).
 *  - Contains a limited number of reads and writes.
 *  # </weight>
 */
export type StakingPayoutStakersCall = {
    validator_stash: AccountId,
    era: EraIndex,
}

export const StakingPayoutStakersCall: sts.Type<StakingPayoutStakersCall> = sts.struct(() => {
    return  {
        validator_stash: AccountId,
        era: EraIndex,
    }
})

/**
 *  A new set of stakers was elected with the given computation method.
 */
export type StakingStakingElectionEvent = [ElectionCompute]

export const StakingStakingElectionEvent: sts.Type<StakingStakingElectionEvent> = sts.tuple(() => ElectionCompute)
