import {sts} from '../../pallet.support'
import {DispatchError, DispatchInfo} from './types'

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
