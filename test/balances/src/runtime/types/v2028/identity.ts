import {sts} from '../../pallet.support'
import {LookupSource, Data, IdentityJudgement} from './types'

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
 *  Provide a judgement for an account's identity.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `reg_index`.
 * 
 *  - `reg_index`: the index of the registrar whose judgement is being made.
 *  - `target`: the account whose identity the judgement is upon. This must be an account
 *    with a registered identity.
 *  - `judgement`: the judgement of the registrar of index `reg_index` about `target`.
 * 
 *  Emits `JudgementGiven` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-transfer operation.
 *  - Up to one account-lookup operation.
 *  - Storage: 1 read `O(R)`, 1 mutate `O(R + X)`.
 *  - One event.
 *  # </weight>
 */
export type IdentityProvideJudgementCall = {
    reg_index: number,
    target: LookupSource,
    judgement: IdentityJudgement,
}

export const IdentityProvideJudgementCall: sts.Type<IdentityProvideJudgementCall> = sts.struct(() => {
    return  {
        reg_index: sts.number(),
        target: LookupSource,
        judgement: IdentityJudgement,
    }
})

/**
 *  Remove an account's identity and sub-account information and slash the deposits.
 * 
 *  Payment: Reserved balances from `set_subs` and `set_identity` are slashed and handled by
 *  `Slash`. Verification request deposits are not returned; they should be cancelled
 *  manually using `cancel_request`.
 * 
 *  The dispatch origin for this call must match `T::ForceOrigin`.
 * 
 *  - `target`: the account whose identity the judgement is upon. This must be an account
 *    with a registered identity.
 * 
 *  Emits `IdentityKilled` if successful.
 * 
 *  # <weight>
 *  - `O(R + S + X)`.
 *  - One balance-reserve operation.
 *  - `S + 2` storage mutations.
 *  - One event.
 *  # </weight>
 */
export type IdentityKillIdentityCall = {
    target: LookupSource,
}

export const IdentityKillIdentityCall: sts.Type<IdentityKillIdentityCall> = sts.struct(() => {
    return  {
        target: LookupSource,
    }
})

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
