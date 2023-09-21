import {sts} from '../../pallet.support'
import {Weight} from './types'

/**
 *  Sets the soft limit for the phase of dispatching dispatchable upward messages.
 */
export type ParachainsConfigurationSetUmpServiceTotalWeightCall = {
    new: Weight,
}

export const ParachainsConfigurationSetUmpServiceTotalWeightCall: sts.Type<ParachainsConfigurationSetUmpServiceTotalWeightCall> = sts.struct(() => {
    return  {
        new: Weight,
    }
})
