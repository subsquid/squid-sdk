import {sts} from '../../pallet.support'
import {RawSolution, SolutionOrSnapshotSize, ElectionCompute, AccountId} from './types'

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

/**
 *  The unsigned phase of the given round has started.
 */
export type ElectionProviderMultiPhaseUnsignedPhaseStartedEvent = [number]

export const ElectionProviderMultiPhaseUnsignedPhaseStartedEvent: sts.Type<ElectionProviderMultiPhaseUnsignedPhaseStartedEvent> = sts.tuple(() => sts.number())

/**
 *  A solution was stored with the given compute.
 * 
 *  If the solution is signed, this means that it hasn't yet been processed. If the
 *  solution is unsigned, this means that it has also been processed.
 */
export type ElectionProviderMultiPhaseSolutionStoredEvent = [ElectionCompute]

export const ElectionProviderMultiPhaseSolutionStoredEvent: sts.Type<ElectionProviderMultiPhaseSolutionStoredEvent> = sts.tuple(() => ElectionCompute)

/**
 *  An account has been slashed for submitting an invalid signed submission.
 */
export type ElectionProviderMultiPhaseSlashedEvent = [AccountId]

export const ElectionProviderMultiPhaseSlashedEvent: sts.Type<ElectionProviderMultiPhaseSlashedEvent> = sts.tuple(() => AccountId)

/**
 *  The signed phase of the given round has started.
 */
export type ElectionProviderMultiPhaseSignedPhaseStartedEvent = [number]

export const ElectionProviderMultiPhaseSignedPhaseStartedEvent: sts.Type<ElectionProviderMultiPhaseSignedPhaseStartedEvent> = sts.tuple(() => sts.number())

/**
 *  An account has been rewarded for their signed submission being finalized.
 */
export type ElectionProviderMultiPhaseRewardedEvent = [AccountId]

export const ElectionProviderMultiPhaseRewardedEvent: sts.Type<ElectionProviderMultiPhaseRewardedEvent> = sts.tuple(() => AccountId)

/**
 *  The election has been finalized, with `Some` of the given computation, or else if the
 *  election failed, `None`.
 */
export type ElectionProviderMultiPhaseElectionFinalizedEvent = [(ElectionCompute | undefined)]

export const ElectionProviderMultiPhaseElectionFinalizedEvent: sts.Type<ElectionProviderMultiPhaseElectionFinalizedEvent> = sts.tuple(() => sts.option(() => ElectionCompute))
