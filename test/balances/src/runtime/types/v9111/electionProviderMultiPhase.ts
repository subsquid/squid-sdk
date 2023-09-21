import {sts} from '../../pallet.support'
import {RawSolution, SolutionOrSnapshotSize, ElectionCompute} from './types'

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
 * 
 * # <weight>
 * Queue size must be provided as witness data.
 * # </weight>
 */
export type ElectionProviderMultiPhaseSubmitCall = {
    rawSolution: RawSolution,
    numSignedSubmissions: number,
}

export const ElectionProviderMultiPhaseSubmitCall: sts.Type<ElectionProviderMultiPhaseSubmitCall> = sts.struct(() => {
    return  {
        rawSolution: RawSolution,
        numSignedSubmissions: sts.number(),
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
    maybeNextScore?: (bigint[] | undefined),
}

export const ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall: sts.Type<ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall> = sts.struct(() => {
    return  {
        maybeNextScore: sts.option(() => sts.array(() => sts.bigint())),
    }
})

/**
 * A solution was stored with the given compute.
 * 
 * If the solution is signed, this means that it hasn't yet been processed. If the
 * solution is unsigned, this means that it has also been processed.
 * 
 * The `bool` is `true` when a previous solution was ejected to make room for this one.
 */
export type ElectionProviderMultiPhaseSolutionStoredEvent = [ElectionCompute, boolean]

export const ElectionProviderMultiPhaseSolutionStoredEvent: sts.Type<ElectionProviderMultiPhaseSolutionStoredEvent> = sts.tuple(() => ElectionCompute, sts.boolean())

/**
 * The election has been finalized, with `Some` of the given computation, or else if the
 * election failed, `None`.
 */
export type ElectionProviderMultiPhaseElectionFinalizedEvent = [(ElectionCompute | undefined)]

export const ElectionProviderMultiPhaseElectionFinalizedEvent: sts.Type<ElectionProviderMultiPhaseElectionFinalizedEvent> = sts.tuple(() => sts.option(() => ElectionCompute))
