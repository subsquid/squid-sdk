import {sts} from '../../pallet.support'
import {RawSolution, SolutionOrSnapshotSize} from './types'

/**
 *  Submit a solution for the unsigned phase.
 * 
 *  The dispatch origin fo this call must be __none__.
 * 
 *  This submission is checked on the fly. Moreover, this unsigned solution is only
 *  validated when submitted to the pool from the **local** node. Effectively, this means
 *  that only active validators can submit this transaction when authoring a block (similar
 *  to an inherent).
 * 
 *  To prevent any incorrect solution (and thus wasted time/weight), this transaction will
 *  panic if the solution submitted by the validator is invalid in any way, effectively
 *  putting their authoring reward at risk.
 * 
 *  No deposit or reward is associated with this submission.
 */
export type ElectionProviderMultiPhaseSubmitUnsignedCall = {
    raw_solution: RawSolution,
    witness: SolutionOrSnapshotSize,
}

export const ElectionProviderMultiPhaseSubmitUnsignedCall: sts.Type<ElectionProviderMultiPhaseSubmitUnsignedCall> = sts.struct(() => {
    return  {
        raw_solution: RawSolution,
        witness: SolutionOrSnapshotSize,
    }
})

/**
 *  Submit a solution for the signed phase.
 * 
 *  The dispatch origin fo this call must be __signed__.
 * 
 *  The solution is potentially queued, based on the claimed score and processed at the end
 *  of the signed phase.
 * 
 *  A deposit is reserved and recorded for the solution. Based on the outcome, the solution
 *  might be rewarded, slashed, or get all or a part of the deposit back.
 * 
 *  # <weight>
 *  Queue size must be provided as witness data.
 *  # </weight>
 */
export type ElectionProviderMultiPhaseSubmitCall = {
    raw_solution: RawSolution,
    num_signed_submissions: number,
}

export const ElectionProviderMultiPhaseSubmitCall: sts.Type<ElectionProviderMultiPhaseSubmitCall> = sts.struct(() => {
    return  {
        raw_solution: RawSolution,
        num_signed_submissions: sts.number(),
    }
})
