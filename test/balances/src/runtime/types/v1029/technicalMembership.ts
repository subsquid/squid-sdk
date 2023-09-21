import {sts} from '../../pallet.support'
import {AccountId} from './types'

/**
 *  Swap out the sending member for some other key `new`.
 * 
 *  May only be called from `Signed` origin of a current member.
 */
export type TechnicalMembershipChangeKeyCall = {
    new: AccountId,
}

export const TechnicalMembershipChangeKeyCall: sts.Type<TechnicalMembershipChangeKeyCall> = sts.struct(() => {
    return  {
        new: AccountId,
    }
})

/**
 *  One of the members' keys changed.
 */
export type TechnicalMembershipKeyChangedEvent = null

export const TechnicalMembershipKeyChangedEvent: sts.Type<TechnicalMembershipKeyChangedEvent> = sts.unit()
