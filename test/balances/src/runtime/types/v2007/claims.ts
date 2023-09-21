import {sts} from '../../pallet.support'
import {EthereumAddress, AccountId} from './types'

export type ClaimsMoveClaimCall = {
    old: EthereumAddress,
    new: EthereumAddress,
    maybe_preclaim?: (AccountId | undefined),
}

export const ClaimsMoveClaimCall: sts.Type<ClaimsMoveClaimCall> = sts.struct(() => {
    return  {
        old: EthereumAddress,
        new: EthereumAddress,
        maybe_preclaim: sts.option(() => AccountId),
    }
})
