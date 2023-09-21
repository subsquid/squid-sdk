import {sts} from '../../pallet.support'
import {EthereumAddress, BalanceOf, BlockNumber} from './types'

/**
 *  Add a new claim, if you are root.
 */
export type ClaimsMintClaimCall = {
    who: EthereumAddress,
    value: BalanceOf,
    vesting_schedule?: ([BalanceOf, BalanceOf, BlockNumber] | undefined),
}

export const ClaimsMintClaimCall: sts.Type<ClaimsMintClaimCall> = sts.struct(() => {
    return  {
        who: EthereumAddress,
        value: BalanceOf,
        vesting_schedule: sts.option(() => sts.tuple(() => BalanceOf, BalanceOf, BlockNumber)),
    }
})
