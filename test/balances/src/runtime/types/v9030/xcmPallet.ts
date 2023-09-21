import {sts} from '../../pallet.support'
import {MultiLocation, MultiAsset, Weight} from './types'

/**
 *  Transfer some assets from the local chain to the sovereign account of a destination chain and forward
 *  a notification XCM.
 * 
 *  - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
 *  - `dest`: Destination context for the assets. Will typically be `X2(Parent, Parachain(..))` to send
 *    from parachain to parachain, or `X1(Parachain(..))` to send from relay to parachain.
 *  - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will generally be
 *    an `AccountId32` value.
 *  - `assets`: The assets to be withdrawn. This should include the assets used to pay the fee on the
 *    `dest` side.
 *  - `dest_weight`: Equal to the total weight on `dest` of the XCM message
 *    `ReserveAssetDeposit { assets, effects: [ BuyExecution{..}, DepositAsset{..} ] }`.
 */
export type XcmPalletReserveTransferAssetsCall = {
    dest: MultiLocation,
    beneficiary: MultiLocation,
    assets: MultiAsset[],
    dest_weight: Weight,
}

export const XcmPalletReserveTransferAssetsCall: sts.Type<XcmPalletReserveTransferAssetsCall> = sts.struct(() => {
    return  {
        dest: MultiLocation,
        beneficiary: MultiLocation,
        assets: sts.array(() => MultiAsset),
        dest_weight: Weight,
    }
})
