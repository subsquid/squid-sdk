import {sts} from '../../pallet.support'

/**
 * Trigger the governance fallback.
 * 
 * This can only be called when [`Phase::Emergency`] is enabled, as an alternative to
 * calling [`Call::set_emergency_election_result`].
 */
export type ElectionProviderMultiPhaseGovernanceFallbackCall = {
    maybeMaxVoters?: (number | undefined),
    maybeMaxTargets?: (number | undefined),
}

export const ElectionProviderMultiPhaseGovernanceFallbackCall: sts.Type<ElectionProviderMultiPhaseGovernanceFallbackCall> = sts.struct(() => {
    return  {
        maybeMaxVoters: sts.option(() => sts.number()),
        maybeMaxTargets: sts.option(() => sts.number()),
    }
})
