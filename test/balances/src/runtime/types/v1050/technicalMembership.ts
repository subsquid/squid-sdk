import {sts} from '../../pallet.support'
import {AccountId} from './types'

/**
 *  Set the prime member. Must be a current member.
 */
export type TechnicalMembershipSetPrimeCall = {
    who: AccountId,
}

export const TechnicalMembershipSetPrimeCall: sts.Type<TechnicalMembershipSetPrimeCall> = sts.struct(() => {
    return  {
        who: AccountId,
    }
})

/**
 *  Remove the prime member if it exists.
 */
export type TechnicalMembershipClearPrimeCall = null

export const TechnicalMembershipClearPrimeCall: sts.Type<TechnicalMembershipClearPrimeCall> = sts.unit()
