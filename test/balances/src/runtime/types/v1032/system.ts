import {sts} from '../../pallet.support'
import {DispatchError, DispatchInfo} from './types'

/**
 *  An extrinsic failed.
 */
export type SystemExtrinsicFailedEvent = [DispatchError, DispatchInfo]

export const SystemExtrinsicFailedEvent: sts.Type<SystemExtrinsicFailedEvent> = sts.tuple(() => DispatchError, DispatchInfo)
