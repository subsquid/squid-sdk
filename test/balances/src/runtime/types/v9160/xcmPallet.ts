import {sts} from '../../pallet.support'
import {VersionedMultiLocation, VersionedXcm, Type_529, V1MultiLocation, V2Xcm, V2Response, V2Error, V2Outcome} from './types'

export type XcmPalletSendCall = {
    dest: VersionedMultiLocation,
    message: VersionedXcm,
}

export const XcmPalletSendCall: sts.Type<XcmPalletSendCall> = sts.struct(() => {
    return  {
        dest: VersionedMultiLocation,
        message: VersionedXcm,
    }
})

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
    message: Type_529,
    maxWeight: bigint,
}

export const XcmPalletExecuteCall: sts.Type<XcmPalletExecuteCall> = sts.struct(() => {
    return  {
        message: Type_529,
        maxWeight: sts.bigint(),
    }
})

/**
 * A XCM message was sent.
 * 
 * \[ origin, destination, message \]
 */
export type XcmPalletSentEvent = [V1MultiLocation, V1MultiLocation, V2Xcm]

export const XcmPalletSentEvent: sts.Type<XcmPalletSentEvent> = sts.tuple(() => V1MultiLocation, V1MultiLocation, V2Xcm)

/**
 * Query response has been received and is ready for taking with `take_response`. There is
 * no registered notification call.
 * 
 * \[ id, response \]
 */
export type XcmPalletResponseReadyEvent = [bigint, V2Response]

export const XcmPalletResponseReadyEvent: sts.Type<XcmPalletResponseReadyEvent> = sts.tuple(() => sts.bigint(), V2Response)

/**
 * A given location which had a version change subscription was dropped owing to an error
 * sending the notification to it.
 * 
 * \[ location, query ID, error \]
 */
export type XcmPalletNotifyTargetSendFailEvent = [V1MultiLocation, bigint, V2Error]

export const XcmPalletNotifyTargetSendFailEvent: sts.Type<XcmPalletNotifyTargetSendFailEvent> = sts.tuple(() => V1MultiLocation, sts.bigint(), V2Error)

/**
 * Execution of an XCM message was attempted.
 * 
 * \[ outcome \]
 */
export type XcmPalletAttemptedEvent = [V2Outcome]

export const XcmPalletAttemptedEvent: sts.Type<XcmPalletAttemptedEvent> = sts.tuple(() => V2Outcome)
