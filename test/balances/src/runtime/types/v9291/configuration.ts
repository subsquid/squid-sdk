import {sts} from '../../pallet.support'
import {Weight} from './types'

/**
 * Sets the soft limit for the phase of dispatching dispatchable upward messages.
 */
export type ConfigurationSetUmpServiceTotalWeightCall = {
    new: Weight,
}

export const ConfigurationSetUmpServiceTotalWeightCall: sts.Type<ConfigurationSetUmpServiceTotalWeightCall> = sts.struct(() => {
    return  {
        new: Weight,
    }
})

/**
 * Sets the maximum amount of weight any individual upward message may consume.
 */
export type ConfigurationSetUmpMaxIndividualWeightCall = {
    new: Weight,
}

export const ConfigurationSetUmpMaxIndividualWeightCall: sts.Type<ConfigurationSetUmpMaxIndividualWeightCall> = sts.struct(() => {
    return  {
        new: Weight,
    }
})
