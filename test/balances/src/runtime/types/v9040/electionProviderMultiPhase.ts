import {sts} from '../../pallet.support'
import {ElectionScore} from './types'

/**
 *  Set a new value for `MinimumUntrustedScore`.
 * 
 *  Dispatch origin must be aligned with `T::ForceOrigin`.
 * 
 *  This check can be turned off by setting the value to `None`.
 */
export type ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall = {
    maybe_next_score?: (ElectionScore | undefined),
}

export const ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall: sts.Type<ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall> = sts.struct(() => {
    return  {
        maybe_next_score: sts.option(() => ElectionScore),
    }
})
