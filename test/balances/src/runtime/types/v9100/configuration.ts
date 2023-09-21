import {sts} from '../../pallet.support'
import {Weight} from './types'

/**
 *  Sets the maximum amount of weight any individual upward message may consume.
 */
export type ConfigurationSetUmpMaxIndividualWeightCall = {
    new: Weight,
}

export const ConfigurationSetUmpMaxIndividualWeightCall: sts.Type<ConfigurationSetUmpMaxIndividualWeightCall> = sts.struct(() => {
    return  {
        new: Weight,
    }
})

/**
 *  Sets the number of sessions after which an HRMP open channel request expires.
 */
export type ConfigurationSetHrmpOpenRequestTtlCall = {
    _new: number,
}

export const ConfigurationSetHrmpOpenRequestTtlCall: sts.Type<ConfigurationSetHrmpOpenRequestTtlCall> = sts.struct(() => {
    return  {
        _new: sts.number(),
    }
})
