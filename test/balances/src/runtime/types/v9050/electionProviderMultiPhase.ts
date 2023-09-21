import {sts} from '../../pallet.support'
import {ReadySolution} from './types'

/**
 *  Set a solution in the queue, to be handed out to the client of this pallet in the next
 *  call to `ElectionProvider::elect`.
 * 
 *  This can only be set by `T::ForceOrigin`, and only when the phase is `Emergency`.
 * 
 *  The solution is not checked for any feasibility and is assumed to be trustworthy, as any
 *  feasibility check itself can in principle cause the election process to fail (due to
 *  memory/weight constrains).
 */
export type ElectionProviderMultiPhaseSetEmergencyElectionResultCall = {
    solution: ReadySolution,
}

export const ElectionProviderMultiPhaseSetEmergencyElectionResultCall: sts.Type<ElectionProviderMultiPhaseSetEmergencyElectionResultCall> = sts.struct(() => {
    return  {
        solution: ReadySolution,
    }
})
