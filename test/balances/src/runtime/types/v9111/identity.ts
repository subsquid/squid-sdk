import {sts} from '../../pallet.support'
import {MultiAddress, Data, Judgement} from './types'

/**
 * Request a judgement from a registrar.
 * 
 * Payment: At most `max_fee` will be reserved for payment to the registrar if judgement
 * given.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must have a
 * registered identity.
 * 
 * - `reg_index`: The index of the registrar whose judgement is requested.
 * - `max_fee`: The maximum fee that may be paid. This should just be auto-populated as:
 * 
 * ```nocompile
 * Self::registrars().get(reg_index).unwrap().fee
 * ```
 * 
 * Emits `JudgementRequested` if successful.
 * 
 * # <weight>
 * - `O(R + X)`.
 * - One balance-reserve operation.
 * - Storage: 1 read `O(R)`, 1 mutate `O(X + R)`.
 * - One event.
 * # </weight>
 */
export type IdentityRequestJudgementCall = {
    regIndex: number,
    maxFee: bigint,
}

export const IdentityRequestJudgementCall: sts.Type<IdentityRequestJudgementCall> = sts.struct(() => {
    return  {
        regIndex: sts.number(),
        maxFee: sts.bigint(),
    }
})

/**
 * Alter the associated name of the given sub-account.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must have a registered
 * sub identity of `sub`.
 */
export type IdentityRenameSubCall = {
    sub: MultiAddress,
    data: Data,
}

export const IdentityRenameSubCall: sts.Type<IdentityRenameSubCall> = sts.struct(() => {
    return  {
        sub: MultiAddress,
        data: Data,
    }
})

/**
 * Remove the given account from the sender's subs.
 * 
 * Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 * to the sender.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must have a registered
 * sub identity of `sub`.
 */
export type IdentityRemoveSubCall = {
    sub: MultiAddress,
}

export const IdentityRemoveSubCall: sts.Type<IdentityRemoveSubCall> = sts.struct(() => {
    return  {
        sub: MultiAddress,
    }
})

/**
 * Provide a judgement for an account's identity.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must be the account
 * of the registrar whose index is `reg_index`.
 * 
 * - `reg_index`: the index of the registrar whose judgement is being made.
 * - `target`: the account whose identity the judgement is upon. This must be an account
 *   with a registered identity.
 * - `judgement`: the judgement of the registrar of index `reg_index` about `target`.
 * 
 * Emits `JudgementGiven` if successful.
 * 
 * # <weight>
 * - `O(R + X)`.
 * - One balance-transfer operation.
 * - Up to one account-lookup operation.
 * - Storage: 1 read `O(R)`, 1 mutate `O(R + X)`.
 * - One event.
 * # </weight>
 */
export type IdentityProvideJudgementCall = {
    regIndex: number,
    target: MultiAddress,
    judgement: Judgement,
}

export const IdentityProvideJudgementCall: sts.Type<IdentityProvideJudgementCall> = sts.struct(() => {
    return  {
        regIndex: sts.number(),
        target: MultiAddress,
        judgement: Judgement,
    }
})

/**
 * Remove an account's identity and sub-account information and slash the deposits.
 * 
 * Payment: Reserved balances from `set_subs` and `set_identity` are slashed and handled by
 * `Slash`. Verification request deposits are not returned; they should be cancelled
 * manually using `cancel_request`.
 * 
 * The dispatch origin for this call must match `T::ForceOrigin`.
 * 
 * - `target`: the account whose identity the judgement is upon. This must be an account
 *   with a registered identity.
 * 
 * Emits `IdentityKilled` if successful.
 * 
 * # <weight>
 * - `O(R + S + X)`.
 * - One balance-reserve operation.
 * - `S + 2` storage mutations.
 * - One event.
 * # </weight>
 */
export type IdentityKillIdentityCall = {
    target: MultiAddress,
}

export const IdentityKillIdentityCall: sts.Type<IdentityKillIdentityCall> = sts.struct(() => {
    return  {
        target: MultiAddress,
    }
})

/**
 * Cancel a previous request.
 * 
 * Payment: A previously reserved deposit is returned on success.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must have a
 * registered identity.
 * 
 * - `reg_index`: The index of the registrar whose judgement is no longer requested.
 * 
 * Emits `JudgementUnrequested` if successful.
 * 
 * # <weight>
 * - `O(R + X)`.
 * - One balance-reserve operation.
 * - One storage mutation `O(R + X)`.
 * - One event
 * # </weight>
 */
export type IdentityCancelRequestCall = {
    regIndex: number,
}

export const IdentityCancelRequestCall: sts.Type<IdentityCancelRequestCall> = sts.struct(() => {
    return  {
        regIndex: sts.number(),
    }
})

/**
 * Add the given account to the sender's subs.
 * 
 * Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 * to the sender.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must have a registered
 * sub identity of `sub`.
 */
export type IdentityAddSubCall = {
    sub: MultiAddress,
    data: Data,
}

export const IdentityAddSubCall: sts.Type<IdentityAddSubCall> = sts.struct(() => {
    return  {
        sub: MultiAddress,
        data: Data,
    }
})
