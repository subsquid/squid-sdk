import {sts} from '../../pallet.support'
import {LookupSource, Data, AccountId, Balance} from './types'

/**
 *  Alter the associated name of the given sub-account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  sub identity of `sub`.
 */
export type IdentityRenameSubCall = {
    sub: LookupSource,
    data: Data,
}

export const IdentityRenameSubCall: sts.Type<IdentityRenameSubCall> = sts.struct(() => {
    return  {
        sub: LookupSource,
        data: Data,
    }
})

/**
 *  Remove the given account from the sender's subs.
 * 
 *  Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 *  to the sender.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  sub identity of `sub`.
 */
export type IdentityRemoveSubCall = {
    sub: LookupSource,
}

export const IdentityRemoveSubCall: sts.Type<IdentityRemoveSubCall> = sts.struct(() => {
    return  {
        sub: LookupSource,
    }
})

/**
 *  Remove the sender as a sub-account.
 * 
 *  Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 *  to the sender (*not* the original depositor).
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  super-identity.
 * 
 *  NOTE: This should not normally be used, but is provided in the case that the non-
 *  controller of an account is maliciously registered as a sub-account.
 */
export type IdentityQuitSubCall = null

export const IdentityQuitSubCall: sts.Type<IdentityQuitSubCall> = sts.unit()

/**
 *  Add the given account to the sender's subs.
 * 
 *  Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 *  to the sender.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  sub identity of `sub`.
 */
export type IdentityAddSubCall = {
    sub: LookupSource,
    data: Data,
}

export const IdentityAddSubCall: sts.Type<IdentityAddSubCall> = sts.struct(() => {
    return  {
        sub: LookupSource,
        data: Data,
    }
})

/**
 *  A sub-identity (first arg) was cleared, and the given deposit repatriated from the
 *  main identity account (second arg) to the sub-identity account.
 */
export type IdentitySubIdentityRevokedEvent = [AccountId, AccountId, Balance]

export const IdentitySubIdentityRevokedEvent: sts.Type<IdentitySubIdentityRevokedEvent> = sts.tuple(() => AccountId, AccountId, Balance)

/**
 *  A sub-identity (first) was removed from an identity (second) and the deposit freed.
 */
export type IdentitySubIdentityRemovedEvent = [AccountId, AccountId, Balance]

export const IdentitySubIdentityRemovedEvent: sts.Type<IdentitySubIdentityRemovedEvent> = sts.tuple(() => AccountId, AccountId, Balance)

/**
 *  A sub-identity (first) was added to an identity (second) and the deposit paid.
 */
export type IdentitySubIdentityAddedEvent = [AccountId, AccountId, Balance]

export const IdentitySubIdentityAddedEvent: sts.Type<IdentitySubIdentityAddedEvent> = sts.tuple(() => AccountId, AccountId, Balance)
