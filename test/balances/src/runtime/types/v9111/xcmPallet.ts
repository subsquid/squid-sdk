import {sts} from '../../pallet.support'
import {VersionedMultiLocation, VersionedMultiAssets, VersionedXcm, V1MultiLocation, Type_513, V2Xcm, V2Response, V2Error, V2Outcome, H256} from './types'

/**
 * Teleport some assets from the local chain to some destination chain.
 * 
 * Fee payment on the destination side is made from the first asset listed in the `assets` vector.
 * 
 * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
 * - `dest`: Destination context for the assets. Will typically be `X2(Parent, Parachain(..))` to send
 *   from parachain to parachain, or `X1(Parachain(..))` to send from relay to parachain.
 * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will generally be
 *   an `AccountId32` value.
 * - `assets`: The assets to be withdrawn. The first item should be the currency used to to pay the fee on the
 *   `dest` side. May not be empty.
 * - `dest_weight`: Equal to the total weight on `dest` of the XCM message
 *   `Teleport { assets, effects: [ BuyExecution{..}, DepositAsset{..} ] }`.
 */
export type XcmPalletTeleportAssetsCall = {
    dest: VersionedMultiLocation,
    beneficiary: VersionedMultiLocation,
    assets: VersionedMultiAssets,
    feeAssetItem: number,
}

export const XcmPalletTeleportAssetsCall: sts.Type<XcmPalletTeleportAssetsCall> = sts.struct(() => {
    return  {
        dest: VersionedMultiLocation,
        beneficiary: VersionedMultiLocation,
        assets: VersionedMultiAssets,
        feeAssetItem: sts.number(),
    }
})

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
 * Transfer some assets from the local chain to the sovereign account of a destination chain and forward
 * a notification XCM.
 * 
 * Fee payment on the destination side is made from the first asset listed in the `assets` vector.
 * 
 * - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
 * - `dest`: Destination context for the assets. Will typically be `X2(Parent, Parachain(..))` to send
 *   from parachain to parachain, or `X1(Parachain(..))` to send from relay to parachain.
 * - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will generally be
 *   an `AccountId32` value.
 * - `assets`: The assets to be withdrawn. This should include the assets used to pay the fee on the
 *   `dest` side.
 * - `fee_asset_item`: The index into `assets` of the item which should be used to pay
 *   fees.
 */
export type XcmPalletReserveTransferAssetsCall = {
    dest: VersionedMultiLocation,
    beneficiary: VersionedMultiLocation,
    assets: VersionedMultiAssets,
    feeAssetItem: number,
}

export const XcmPalletReserveTransferAssetsCall: sts.Type<XcmPalletReserveTransferAssetsCall> = sts.struct(() => {
    return  {
        dest: VersionedMultiLocation,
        beneficiary: VersionedMultiLocation,
        assets: VersionedMultiAssets,
        feeAssetItem: sts.number(),
    }
})

/**
 * Extoll that a particular destination can be communicated with through a particular
 * version of XCM.
 * 
 * - `origin`: Must be Root.
 * - `location`: The destination that is being described.
 * - `xcm_version`: The latest version of XCM that `location` supports.
 */
export type XcmPalletForceXcmVersionCall = {
    location: V1MultiLocation,
    xcmVersion: number,
}

export const XcmPalletForceXcmVersionCall: sts.Type<XcmPalletForceXcmVersionCall> = sts.struct(() => {
    return  {
        location: V1MultiLocation,
        xcmVersion: sts.number(),
    }
})

/**
 * Require that a particular destination should no longer notify us regarding any XCM
 * version changes.
 * 
 * - `origin`: Must be Root.
 * - `location`: The location to which we are currently subscribed for XCM version
 *   notifications which we no longer desire.
 */
export type XcmPalletForceUnsubscribeVersionNotifyCall = {
    location: VersionedMultiLocation,
}

export const XcmPalletForceUnsubscribeVersionNotifyCall: sts.Type<XcmPalletForceUnsubscribeVersionNotifyCall> = sts.struct(() => {
    return  {
        location: VersionedMultiLocation,
    }
})

/**
 * Ask a location to notify us regarding their XCM version and any changes to it.
 * 
 * - `origin`: Must be Root.
 * - `location`: The location to which we should subscribe for XCM version notifications.
 */
export type XcmPalletForceSubscribeVersionNotifyCall = {
    location: VersionedMultiLocation,
}

export const XcmPalletForceSubscribeVersionNotifyCall: sts.Type<XcmPalletForceSubscribeVersionNotifyCall> = sts.struct(() => {
    return  {
        location: VersionedMultiLocation,
    }
})

/**
 * Set a safe XCM version (the version that XCM should be encoded with if the most recent
 * version a destination can accept is unknown).
 * 
 * - `origin`: Must be Root.
 * - `maybe_xcm_version`: The default XCM encoding version, or `None` to disable.
 */
export type XcmPalletForceDefaultXcmVersionCall = {
    maybeXcmVersion?: (number | undefined),
}

export const XcmPalletForceDefaultXcmVersionCall: sts.Type<XcmPalletForceDefaultXcmVersionCall> = sts.struct(() => {
    return  {
        maybeXcmVersion: sts.option(() => sts.number()),
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
    message: Type_513,
    maxWeight: bigint,
}

export const XcmPalletExecuteCall: sts.Type<XcmPalletExecuteCall> = sts.struct(() => {
    return  {
        message: Type_513,
        maxWeight: sts.bigint(),
    }
})

/**
 * An XCM version change notification message has been attempted to be sent.
 * 
 * \[ destination, result \]
 */
export type XcmPalletVersionChangeNotifiedEvent = [V1MultiLocation, number]

export const XcmPalletVersionChangeNotifiedEvent: sts.Type<XcmPalletVersionChangeNotifiedEvent> = sts.tuple(() => V1MultiLocation, sts.number())

/**
 * Query response received which does not match a registered query. This may be because a
 * matching query was never registered, it may be because it is a duplicate response, or
 * because the query timed out.
 * 
 * \[ origin location, id \]
 */
export type XcmPalletUnexpectedResponseEvent = [V1MultiLocation, bigint]

export const XcmPalletUnexpectedResponseEvent: sts.Type<XcmPalletUnexpectedResponseEvent> = sts.tuple(() => V1MultiLocation, sts.bigint())

/**
 * The supported version of a location has been changed. This might be through an
 * automatic notification or a manual intervention.
 * 
 * \[ location, XCM version \]
 */
export type XcmPalletSupportedVersionChangedEvent = [V1MultiLocation, number]

export const XcmPalletSupportedVersionChangedEvent: sts.Type<XcmPalletSupportedVersionChangedEvent> = sts.tuple(() => V1MultiLocation, sts.number())

/**
 * A XCM message was sent.
 * 
 * \[ origin, destination, message \]
 */
export type XcmPalletSentEvent = [V1MultiLocation, V1MultiLocation, V2Xcm]

export const XcmPalletSentEvent: sts.Type<XcmPalletSentEvent> = sts.tuple(() => V1MultiLocation, V1MultiLocation, V2Xcm)

/**
 * Received query response has been read and removed.
 * 
 * \[ id \]
 */
export type XcmPalletResponseTakenEvent = [bigint]

export const XcmPalletResponseTakenEvent: sts.Type<XcmPalletResponseTakenEvent> = sts.tuple(() => sts.bigint())

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
 * A given location which had a version change subscription was dropped owing to an error
 * migrating the location to our new XCM format.
 * 
 * \[ location, query ID \]
 */
export type XcmPalletNotifyTargetMigrationFailEvent = [VersionedMultiLocation, bigint]

export const XcmPalletNotifyTargetMigrationFailEvent: sts.Type<XcmPalletNotifyTargetMigrationFailEvent> = sts.tuple(() => VersionedMultiLocation, sts.bigint())

/**
 * Query response has been received and query is removed. The registered notification could
 * not be dispatched because the dispatch weight is greater than the maximum weight
 * originally budgeted by this runtime for the query result.
 * 
 * \[ id, pallet index, call index, actual weight, max budgeted weight \]
 */
export type XcmPalletNotifyOverweightEvent = [bigint, number, number, bigint, bigint]

export const XcmPalletNotifyOverweightEvent: sts.Type<XcmPalletNotifyOverweightEvent> = sts.tuple(() => sts.bigint(), sts.number(), sts.number(), sts.bigint(), sts.bigint())

/**
 * Query response has been received and query is removed. There was a general error with
 * dispatching the notification call.
 * 
 * \[ id, pallet index, call index \]
 */
export type XcmPalletNotifyDispatchErrorEvent = [bigint, number, number]

export const XcmPalletNotifyDispatchErrorEvent: sts.Type<XcmPalletNotifyDispatchErrorEvent> = sts.tuple(() => sts.bigint(), sts.number(), sts.number())

/**
 * Query response has been received and query is removed. The dispatch was unable to be
 * decoded into a `Call`; this might be due to dispatch function having a signature which
 * is not `(origin, QueryId, Response)`.
 * 
 * \[ id, pallet index, call index \]
 */
export type XcmPalletNotifyDecodeFailedEvent = [bigint, number, number]

export const XcmPalletNotifyDecodeFailedEvent: sts.Type<XcmPalletNotifyDecodeFailedEvent> = sts.tuple(() => sts.bigint(), sts.number(), sts.number())

/**
 * Query response has been received and query is removed. The registered notification has
 * been dispatched and executed successfully.
 * 
 * \[ id, pallet index, call index \]
 */
export type XcmPalletNotifiedEvent = [bigint, number, number]

export const XcmPalletNotifiedEvent: sts.Type<XcmPalletNotifiedEvent> = sts.tuple(() => sts.bigint(), sts.number(), sts.number())

/**
 * Expected query response has been received but the expected origin location placed in
 * storate by this runtime previously cannot be decoded. The query remains registered.
 * 
 * This is unexpected (since a location placed in storage in a previously executing
 * runtime should be readable prior to query timeout) and dangerous since the possibly
 * valid response will be dropped. Manual governance intervention is probably going to be
 * needed.
 * 
 * \[ origin location, id \]
 */
export type XcmPalletInvalidResponderVersionEvent = [V1MultiLocation, bigint]

export const XcmPalletInvalidResponderVersionEvent: sts.Type<XcmPalletInvalidResponderVersionEvent> = sts.tuple(() => V1MultiLocation, sts.bigint())

/**
 * Expected query response has been received but the origin location of the response does
 * not match that expected. The query remains registered for a later, valid, response to
 * be received and acted upon.
 * 
 * \[ origin location, id, expected location \]
 */
export type XcmPalletInvalidResponderEvent = [V1MultiLocation, bigint, (V1MultiLocation | undefined)]

export const XcmPalletInvalidResponderEvent: sts.Type<XcmPalletInvalidResponderEvent> = sts.tuple(() => V1MultiLocation, sts.bigint(), sts.option(() => V1MultiLocation))

/**
 * Execution of an XCM message was attempted.
 * 
 * \[ outcome \]
 */
export type XcmPalletAttemptedEvent = [V2Outcome]

export const XcmPalletAttemptedEvent: sts.Type<XcmPalletAttemptedEvent> = sts.tuple(() => V2Outcome)

/**
 * Some assets have been placed in an asset trap.
 * 
 * \[ hash, origin, assets \]
 */
export type XcmPalletAssetsTrappedEvent = [H256, V1MultiLocation, VersionedMultiAssets]

export const XcmPalletAssetsTrappedEvent: sts.Type<XcmPalletAssetsTrappedEvent> = sts.tuple(() => H256, V1MultiLocation, VersionedMultiAssets)
