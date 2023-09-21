import {sts} from '../../pallet.support'
import {AccountId, PhantomData} from './types'

/**
 *  Swap out one member `remove` for another `add`.
 * 
 *  May only be called from `SwapOrigin` or root.
 */
export type TechnicalMembershipSwapMemberCall = {
    remove: AccountId,
    add: AccountId,
}

export const TechnicalMembershipSwapMemberCall: sts.Type<TechnicalMembershipSwapMemberCall> = sts.struct(() => {
    return  {
        remove: AccountId,
        add: AccountId,
    }
})

/**
 *  Change the membership to a new set, disregarding the existing membership. Be nice and
 *  pass `members` pre-sorted.
 * 
 *  May only be called from `ResetOrigin` or root.
 */
export type TechnicalMembershipResetMembersCall = {
    members: AccountId[],
}

export const TechnicalMembershipResetMembersCall: sts.Type<TechnicalMembershipResetMembersCall> = sts.struct(() => {
    return  {
        members: sts.array(() => AccountId),
    }
})

/**
 *  Remove a member `who` from the set.
 * 
 *  May only be called from `RemoveOrigin` or root.
 */
export type TechnicalMembershipRemoveMemberCall = {
    who: AccountId,
}

export const TechnicalMembershipRemoveMemberCall: sts.Type<TechnicalMembershipRemoveMemberCall> = sts.struct(() => {
    return  {
        who: AccountId,
    }
})

/**
 *  Add a member `who` to the set.
 * 
 *  May only be called from `AddOrigin` or root.
 */
export type TechnicalMembershipAddMemberCall = {
    who: AccountId,
}

export const TechnicalMembershipAddMemberCall: sts.Type<TechnicalMembershipAddMemberCall> = sts.struct(() => {
    return  {
        who: AccountId,
    }
})

/**
 *  Two members were swapped; see the transaction for who.
 */
export type TechnicalMembershipMembersSwappedEvent = null

export const TechnicalMembershipMembersSwappedEvent: sts.Type<TechnicalMembershipMembersSwappedEvent> = sts.unit()

/**
 *  The membership was reset; see the transaction for who the new set is.
 */
export type TechnicalMembershipMembersResetEvent = null

export const TechnicalMembershipMembersResetEvent: sts.Type<TechnicalMembershipMembersResetEvent> = sts.unit()

/**
 *  The given member was removed; see the transaction for who.
 */
export type TechnicalMembershipMemberRemovedEvent = null

export const TechnicalMembershipMemberRemovedEvent: sts.Type<TechnicalMembershipMemberRemovedEvent> = sts.unit()

/**
 *  The given member was added; see the transaction for who.
 */
export type TechnicalMembershipMemberAddedEvent = null

export const TechnicalMembershipMemberAddedEvent: sts.Type<TechnicalMembershipMemberAddedEvent> = sts.unit()

/**
 *  Phantom member, never used.
 */
export type TechnicalMembershipDummyEvent = [PhantomData]

export const TechnicalMembershipDummyEvent: sts.Type<TechnicalMembershipDummyEvent> = sts.tuple(() => PhantomData)
