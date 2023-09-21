import {sts} from '../../pallet.support'
import {VersionedMultiLocation, VersionedMultiAssets, V2WeightLimit} from './types'

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
 * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
 */
export type XcmPalletLimitedTeleportAssetsCall = {
    dest: VersionedMultiLocation,
    beneficiary: VersionedMultiLocation,
    assets: VersionedMultiAssets,
    feeAssetItem: number,
    weightLimit: V2WeightLimit,
}

export const XcmPalletLimitedTeleportAssetsCall: sts.Type<XcmPalletLimitedTeleportAssetsCall> = sts.struct(() => {
    return  {
        dest: VersionedMultiLocation,
        beneficiary: VersionedMultiLocation,
        assets: VersionedMultiAssets,
        feeAssetItem: sts.number(),
        weightLimit: V2WeightLimit,
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
 * - `weight_limit`: The remote-side weight limit, if any, for the XCM fee purchase.
 */
export type XcmPalletLimitedReserveTransferAssetsCall = {
    dest: VersionedMultiLocation,
    beneficiary: VersionedMultiLocation,
    assets: VersionedMultiAssets,
    feeAssetItem: number,
    weightLimit: V2WeightLimit,
}

export const XcmPalletLimitedReserveTransferAssetsCall: sts.Type<XcmPalletLimitedReserveTransferAssetsCall> = sts.struct(() => {
    return  {
        dest: VersionedMultiLocation,
        beneficiary: VersionedMultiLocation,
        assets: VersionedMultiAssets,
        feeAssetItem: sts.number(),
        weightLimit: V2WeightLimit,
    }
})
