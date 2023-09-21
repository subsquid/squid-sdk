import {sts} from '../../pallet.support'
import {ValidatorIndex, CompactAssignments, ElectionScore, EraIndex, ElectionSize} from './types'

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
