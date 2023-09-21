import {sts} from '../../pallet.support'
import {Supports, AccountId, Balance} from './types'

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
    supports: Supports,
}

export const ElectionProviderMultiPhaseSetEmergencyElectionResultCall: sts.Type<ElectionProviderMultiPhaseSetEmergencyElectionResultCall> = sts.struct(() => {
    return  {
        supports: Supports,
    }
})

/**
 *  An account has been slashed for submitting an invalid signed submission.
 */
export type ElectionProviderMultiPhaseSlashedEvent = [AccountId, Balance]

export const ElectionProviderMultiPhaseSlashedEvent: sts.Type<ElectionProviderMultiPhaseSlashedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  An account has been rewarded for their signed submission being finalized.
 */
export type ElectionProviderMultiPhaseRewardedEvent = [AccountId, Balance]

export const ElectionProviderMultiPhaseRewardedEvent: sts.Type<ElectionProviderMultiPhaseRewardedEvent> = sts.tuple(() => AccountId, Balance)
