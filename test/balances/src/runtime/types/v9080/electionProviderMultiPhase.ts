import {sts} from '../../pallet.support'
import {RawSolution, ElectionCompute} from './types'

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
    solution: RawSolution,
    num_signed_submissions: number,
}

export const ElectionProviderMultiPhaseSubmitCall: sts.Type<ElectionProviderMultiPhaseSubmitCall> = sts.struct(() => {
    return  {
        solution: RawSolution,
        num_signed_submissions: sts.number(),
    }
})

/**
 *  A solution was stored with the given compute.
 * 
 *  If the solution is signed, this means that it hasn't yet been processed. If the
 *  solution is unsigned, this means that it has also been processed.
 * 
 *  The `bool` is `true` when a previous solution was ejected to make room for this one.
 */
export type ElectionProviderMultiPhaseSolutionStoredEvent = [ElectionCompute, boolean]

export const ElectionProviderMultiPhaseSolutionStoredEvent: sts.Type<ElectionProviderMultiPhaseSolutionStoredEvent> = sts.tuple(() => ElectionCompute, sts.boolean())
