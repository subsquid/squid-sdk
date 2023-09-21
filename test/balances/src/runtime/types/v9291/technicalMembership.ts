import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Swap out one member `remove` for another `add`.
 * 
 * May only be called from `T::SwapOrigin`.
 * 
 * Prime membership is *not* passed from `remove` to `add`, if extant.
 */
export type TechnicalMembershipSwapMemberCall = {
    remove: MultiAddress,
    add: MultiAddress,
}

export const TechnicalMembershipSwapMemberCall: sts.Type<TechnicalMembershipSwapMemberCall> = sts.struct(() => {
    return  {
        remove: MultiAddress,
        add: MultiAddress,
    }
})

/**
 * Set the prime member. Must be a current member.
 * 
 * May only be called from `T::PrimeOrigin`.
 */
export type TechnicalMembershipSetPrimeCall = {
    who: MultiAddress,
}

export const TechnicalMembershipSetPrimeCall: sts.Type<TechnicalMembershipSetPrimeCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
    }
})

/**
 * Remove a member `who` from the set.
 * 
 * May only be called from `T::RemoveOrigin`.
 */
export type TechnicalMembershipRemoveMemberCall = {
    who: MultiAddress,
}

export const TechnicalMembershipRemoveMemberCall: sts.Type<TechnicalMembershipRemoveMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
    }
})

/**
 * Swap out the sending member for some other key `new`.
 * 
 * May only be called from `Signed` origin of a current member.
 * 
 * Prime membership is passed from the origin account to `new`, if extant.
 */
export type TechnicalMembershipChangeKeyCall = {
    new: MultiAddress,
}

export const TechnicalMembershipChangeKeyCall: sts.Type<TechnicalMembershipChangeKeyCall> = sts.struct(() => {
    return  {
        new: MultiAddress,
    }
})

/**
 * Add a member `who` to the set.
 * 
 * May only be called from `T::AddOrigin`.
 */
export type TechnicalMembershipAddMemberCall = {
    who: MultiAddress,
}

export const TechnicalMembershipAddMemberCall: sts.Type<TechnicalMembershipAddMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
    }
})
