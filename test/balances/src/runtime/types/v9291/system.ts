import {sts} from '../../pallet.support'
import {DispatchInfo, DispatchError} from './types'

/**
 * An extrinsic completed successfully.
 */
export type SystemExtrinsicSuccessEvent = {
    dispatchInfo: DispatchInfo,
}

export const SystemExtrinsicSuccessEvent: sts.Type<SystemExtrinsicSuccessEvent> = sts.struct(() => {
    return  {
        dispatchInfo: DispatchInfo,
    }
})

/**
 * An extrinsic failed.
 */
export type SystemExtrinsicFailedEvent = {
    dispatchError: DispatchError,
    dispatchInfo: DispatchInfo,
}

export const SystemExtrinsicFailedEvent: sts.Type<SystemExtrinsicFailedEvent> = sts.struct(() => {
    return  {
        dispatchError: DispatchError,
        dispatchInfo: DispatchInfo,
    }
})
