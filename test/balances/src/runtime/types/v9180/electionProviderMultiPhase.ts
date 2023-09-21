import {sts} from '../../pallet.support'
import {RawSolution, SolutionOrSnapshotSize, ElectionScore} from './types'

/**
 * Submit a solution for the unsigned phase.
 * 
 * The dispatch origin fo this call must be __none__.
 * 
 * This submission is checked on the fly. Moreover, this unsigned solution is only
 * validated when submitted to the pool from the **local** node. Effectively, this means
 * that only active validators can submit this transaction when authoring a block (similar
 * to an inherent).
 * 
 * To prevent any incorrect solution (and thus wasted time/weight), this transaction will
 * panic if the solution submitted by the validator is invalid in any way, effectively
 * putting their authoring reward at risk.
 * 
 * No deposit or reward is associated with this submission.
 */
export type ElectionProviderMultiPhaseSubmitUnsignedCall = {
    rawSolution: RawSolution,
    witness: SolutionOrSnapshotSize,
}

export const ElectionProviderMultiPhaseSubmitUnsignedCall: sts.Type<ElectionProviderMultiPhaseSubmitUnsignedCall> = sts.struct(() => {
    return  {
        rawSolution: RawSolution,
        witness: SolutionOrSnapshotSize,
    }
})

/**
 * Submit a solution for the signed phase.
 * 
 * The dispatch origin fo this call must be __signed__.
 * 
 * The solution is potentially queued, based on the claimed score and processed at the end
 * of the signed phase.
 * 
 * A deposit is reserved and recorded for the solution. Based on the outcome, the solution
 * might be rewarded, slashed, or get all or a part of the deposit back.
 */
export type ElectionProviderMultiPhaseSubmitCall = {
    rawSolution: RawSolution,
}

export const ElectionProviderMultiPhaseSubmitCall: sts.Type<ElectionProviderMultiPhaseSubmitCall> = sts.struct(() => {
    return  {
        rawSolution: RawSolution,
    }
})

/**
 * Set a new value for `MinimumUntrustedScore`.
 * 
 * Dispatch origin must be aligned with `T::ForceOrigin`.
 * 
 * This check can be turned off by setting the value to `None`.
 */
export type ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall = {
    maybeNextScore?: (ElectionScore | undefined),
}

export const ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall: sts.Type<ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall> = sts.struct(() => {
    return  {
        maybeNextScore: sts.option(() => ElectionScore),
    }
})
