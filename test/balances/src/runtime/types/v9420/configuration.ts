import {sts} from '../../pallet.support'
import {V4ExecutorParams, AsyncBackingParams} from './types'

/**
 * Set PVF executor parameters.
 */
export type ConfigurationSetExecutorParamsCall = {
    new: V4ExecutorParams,
}

export const ConfigurationSetExecutorParamsCall: sts.Type<ConfigurationSetExecutorParamsCall> = sts.struct(() => {
    return  {
        new: V4ExecutorParams,
    }
})

/**
 * Set the asynchronous backing parameters.
 */
export type ConfigurationSetAsyncBackingParamsCall = {
    new: AsyncBackingParams,
}

export const ConfigurationSetAsyncBackingParamsCall: sts.Type<ConfigurationSetAsyncBackingParamsCall> = sts.struct(() => {
    return  {
        new: AsyncBackingParams,
    }
})
