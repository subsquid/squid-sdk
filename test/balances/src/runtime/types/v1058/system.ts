import {sts} from '../../pallet.support'
import {DispatchInfo, DispatchError} from './types'

/**
 *  An extrinsic completed successfully.
 */
export type SystemExtrinsicSuccessEvent = [DispatchInfo]

export const SystemExtrinsicSuccessEvent: sts.Type<SystemExtrinsicSuccessEvent> = sts.tuple(() => DispatchInfo)

/**
 *  An extrinsic failed.
 */
export type SystemExtrinsicFailedEvent = [DispatchError, DispatchInfo]

export const SystemExtrinsicFailedEvent: sts.Type<SystemExtrinsicFailedEvent> = sts.tuple(() => DispatchError, DispatchInfo)
