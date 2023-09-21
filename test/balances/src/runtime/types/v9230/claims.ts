import {sts} from '../../pallet.support'
import {AccountId32, EthereumAddress} from './types'

/**
 * Someone claimed some DOTs.
 */
export type ClaimsClaimedEvent = {
    who: AccountId32,
    ethereumAddress: EthereumAddress,
    amount: bigint,
}

export const ClaimsClaimedEvent: sts.Type<ClaimsClaimedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        ethereumAddress: EthereumAddress,
        amount: sts.bigint(),
    }
})
