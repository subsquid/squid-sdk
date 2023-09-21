import {sts} from '../../pallet.support'

/**
 * Sets the number of sessions after which an HRMP open channel request expires.
 */
export type ConfigurationSetHrmpOpenRequestTtlCall = {
    new: number,
}

export const ConfigurationSetHrmpOpenRequestTtlCall: sts.Type<ConfigurationSetHrmpOpenRequestTtlCall> = sts.struct(() => {
    return  {
        new: sts.number(),
    }
})
