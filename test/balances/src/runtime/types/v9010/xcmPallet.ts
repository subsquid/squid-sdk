import {sts} from '../../pallet.support'
import {MultiLocation, MultiAsset, Weight, Xcm, Outcome} from './types'

/**
 *  Teleport some assets from the local chain to some destination chain.
 * 
 *  - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
 *  - `dest`: Destination context for the assets. Will typically be `X2(Parent, Parachain(..))` to send
 *    from parachain to parachain, or `X1(Parachain(..))` to send from relay to parachain.
 *  - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will generally be
 *    an `AccountId32` value.
 *  - `assets`: The assets to be withdrawn. This should include the assets used to pay the fee on the
 *    `dest` side.
 *  - `dest_weight`: Equal to the total weight on `dest` of the XCM message
 *    `Teleport { assets, effects: [ BuyExecution{..}, DepositAsset{..} ] }`.
 */
export type XcmPalletTeleportAssetsCall = {
    dest: MultiLocation,
    beneficiary: MultiLocation,
    assets: MultiAsset[],
    dest_weight: Weight,
}

export const XcmPalletTeleportAssetsCall: sts.Type<XcmPalletTeleportAssetsCall> = sts.struct(() => {
    return  {
        dest: MultiLocation,
        beneficiary: MultiLocation,
        assets: sts.array(() => MultiAsset),
        dest_weight: Weight,
    }
})

export type XcmPalletSendCall = {
    dest: MultiLocation,
    message: Xcm,
}

export const XcmPalletSendCall: sts.Type<XcmPalletSendCall> = sts.struct(() => {
    return  {
        dest: MultiLocation,
        message: Xcm,
    }
})

/**
 *  Execute an XCM message from a local, signed, origin.
 * 
 *  An event is deposited indicating whether `msg` could be executed completely or only
 *  partially.
 * 
 *  No more than `max_weight` will be used in its attempted execution. If this is less than the
 *  maximum amount of weight that the message could take to be executed, then no execution
 *  attempt will be made.
 * 
 *  NOTE: A successful return to this does *not* imply that the `msg` was executed successfully
 *  to completion; only that *some* of it was executed.
 */
export type XcmPalletExecuteCall = {
    message: Xcm,
    max_weight: Weight,
}

export const XcmPalletExecuteCall: sts.Type<XcmPalletExecuteCall> = sts.struct(() => {
    return  {
        message: Xcm,
        max_weight: Weight,
    }
})

export type XcmPalletSentEvent = [MultiLocation, MultiLocation, Xcm]

export const XcmPalletSentEvent: sts.Type<XcmPalletSentEvent> = sts.tuple(() => MultiLocation, MultiLocation, Xcm)

export type XcmPalletAttemptedEvent = [Outcome]

export const XcmPalletAttemptedEvent: sts.Type<XcmPalletAttemptedEvent> = sts.tuple(() => Outcome)
