import {sts} from '../../pallet.support'
import {Type_553, Weight} from './types'

/**
 * Execute an XCM message from a local, signed, origin.
 * 
 * An event is deposited indicating whether `msg` could be executed completely or only
 * partially.
 * 
 * No more than `max_weight` will be used in its attempted execution. If this is less than the
 * maximum amount of weight that the message could take to be executed, then no execution
 * attempt will be made.
 * 
 * NOTE: A successful return to this does *not* imply that the `msg` was executed successfully
 * to completion; only that *some* of it was executed.
 */
export type XcmPalletExecuteCall = {
    message: Type_553,
    maxWeight: Weight,
}

export const XcmPalletExecuteCall: sts.Type<XcmPalletExecuteCall> = sts.struct(() => {
    return  {
        message: Type_553,
        maxWeight: Weight,
    }
})

/**
 * Query response has been received and query is removed. The registered notification could
 * not be dispatched because the dispatch weight is greater than the maximum weight
 * originally budgeted by this runtime for the query result.
 * 
 * \[ id, pallet index, call index, actual weight, max budgeted weight \]
 */
export type XcmPalletNotifyOverweightEvent = [bigint, number, number, Weight, Weight]

export const XcmPalletNotifyOverweightEvent: sts.Type<XcmPalletNotifyOverweightEvent> = sts.tuple(() => sts.bigint(), sts.number(), sts.number(), Weight, Weight)
