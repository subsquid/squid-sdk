import {sts} from '../../pallet.support'
import {VersionedMultiLocation, VersionedMultiAssets, Weight, VersionedXcm, MultiLocation, Xcm, Outcome} from './types'

/**
 *  Teleport some assets from the local chain to some destination chain.
 * 
 *  Fee payment on the destination side is made from the first asset listed in the `assets` vector.
 * 
 *  - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
 *  - `dest`: Destination context for the assets. Will typically be `X2(Parent, Parachain(..))` to send
 *    from parachain to parachain, or `X1(Parachain(..))` to send from relay to parachain.
 *  - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will generally be
 *    an `AccountId32` value.
 *  - `assets`: The assets to be withdrawn. The first item should be the currency used to to pay the fee on the
 *    `dest` side. May not be empty.
 *  - `dest_weight`: Equal to the total weight on `dest` of the XCM message
 *    `Teleport { assets, effects: [ BuyExecution{..}, DepositAsset{..} ] }`.
 */
export type XcmPalletTeleportAssetsCall = {
    dest: VersionedMultiLocation,
    beneficiary: VersionedMultiLocation,
    assets: VersionedMultiAssets,
    fee_asset_item: number,
    dest_weight: Weight,
}

export const XcmPalletTeleportAssetsCall: sts.Type<XcmPalletTeleportAssetsCall> = sts.struct(() => {
    return  {
        dest: VersionedMultiLocation,
        beneficiary: VersionedMultiLocation,
        assets: VersionedMultiAssets,
        fee_asset_item: sts.number(),
        dest_weight: Weight,
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
 *  Transfer some assets from the local chain to the sovereign account of a destination chain and forward
 *  a notification XCM.
 * 
 *  Fee payment on the destination side is made from the first asset listed in the `assets` vector.
 * 
 *  - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
 *  - `dest`: Destination context for the assets. Will typically be `X2(Parent, Parachain(..))` to send
 *    from parachain to parachain, or `X1(Parachain(..))` to send from relay to parachain.
 *  - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will generally be
 *    an `AccountId32` value.
 *  - `assets`: The assets to be withdrawn. This should include the assets used to pay the fee on the
 *    `dest` side.
 *  - `dest_weight`: Equal to the total weight on `dest` of the XCM message
 *    `ReserveAssetDeposited { assets, effects: [ BuyExecution{..}, DepositAsset{..} ] }`.
 */
export type XcmPalletReserveTransferAssetsCall = {
    dest: VersionedMultiLocation,
    beneficiary: VersionedMultiLocation,
    assets: VersionedMultiAssets,
    fee_asset_item: number,
    dest_weight: Weight,
}

export const XcmPalletReserveTransferAssetsCall: sts.Type<XcmPalletReserveTransferAssetsCall> = sts.struct(() => {
    return  {
        dest: VersionedMultiLocation,
        beneficiary: VersionedMultiLocation,
        assets: VersionedMultiAssets,
        fee_asset_item: sts.number(),
        dest_weight: Weight,
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
    message: VersionedXcm,
    max_weight: Weight,
}

export const XcmPalletExecuteCall: sts.Type<XcmPalletExecuteCall> = sts.struct(() => {
    return  {
        message: VersionedXcm,
        max_weight: Weight,
    }
})

export type XcmPalletSentEvent = [MultiLocation, MultiLocation, Xcm]

export const XcmPalletSentEvent: sts.Type<XcmPalletSentEvent> = sts.tuple(() => MultiLocation, MultiLocation, Xcm)

export type XcmPalletAttemptedEvent = [Outcome]

export const XcmPalletAttemptedEvent: sts.Type<XcmPalletAttemptedEvent> = sts.tuple(() => Outcome)
