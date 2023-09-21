import {sts} from '../../pallet.support'
import {EthereumAddress, BalanceOf, AccountId, EcdsaSignature, Balance} from './types'

/**
 *  Add a new claim, if you are root.
 */
export type ClaimsMintClaimCall = {
    who: EthereumAddress,
    value: BalanceOf,
}

export const ClaimsMintClaimCall: sts.Type<ClaimsMintClaimCall> = sts.struct(() => {
    return  {
        who: EthereumAddress,
        value: BalanceOf,
    }
})

/**
 *  Make a claim.
 */
export type ClaimsClaimCall = {
    dest: AccountId,
    ethereum_signature: EcdsaSignature,
}

export const ClaimsClaimCall: sts.Type<ClaimsClaimCall> = sts.struct(() => {
    return  {
        dest: AccountId,
        ethereum_signature: EcdsaSignature,
    }
})

/**
 *  Someone claimed some DOTs.
 */
export type ClaimsClaimedEvent = [AccountId, EthereumAddress, Balance]

export const ClaimsClaimedEvent: sts.Type<ClaimsClaimedEvent> = sts.tuple(() => AccountId, EthereumAddress, Balance)
