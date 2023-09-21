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
    solution: RawSolution,
    witness: SolutionOrSnapshotSize,
}

export const ElectionProviderMultiPhaseSubmitUnsignedCall: sts.Type<ElectionProviderMultiPhaseSubmitUnsignedCall> = sts.struct(() => {
    return  {
        solution: RawSolution,
        witness: SolutionOrSnapshotSize,
    }
})
