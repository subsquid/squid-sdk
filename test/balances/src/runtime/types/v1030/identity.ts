import {sts} from '../../pallet.support'
import {AccountId, Data, IdentityInfo, LookupSource, IdentityJudgement, RegistrarIndex, Balance} from './types'

/**
 *  Set the sub-accounts of the sender.
 * 
 *  Payment: Any aggregate balance reserved by previous `set_subs` calls will be returned
 *  and an amount `SubAccountDeposit` will be reserved for each item in `subs`.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  - `subs`: The identity's sub-accounts.
 * 
 *  # <weight>
 *  - `O(S)` where `S` subs-count (hard- and deposit-bounded).
 *  - At most two balance operations.
 *  - One storage mutation (codec `O(S)`); one storage-exists.
 *  # </weight>
 */
export type IdentitySetSubsCall = {
    subs: [AccountId, Data][],
}

export const IdentitySetSubsCall: sts.Type<IdentitySetSubsCall> = sts.struct(() => {
    return  {
        subs: sts.array(() => sts.tuple(() => AccountId, Data)),
    }
})

/**
 *  Set an account's identity information and reserve the appropriate deposit.
 * 
 *  If the account already has identity information, the deposit is taken as part payment
 *  for the new deposit.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  - `info`: The identity information.
 * 
 *  Emits `IdentitySet` if successful.
 * 
 *  # <weight>
 *  - `O(X + R)` where `X` additional-field-count (deposit-bounded).
 *  - At most two balance operations.
 *  - One storage mutation (codec `O(X + R)`).
 *  - One event.
 *  # </weight>
 */
export type IdentitySetIdentityCall = {
    info: IdentityInfo,
}

export const IdentitySetIdentityCall: sts.Type<IdentitySetIdentityCall> = sts.struct(() => {
    return  {
        info: IdentityInfo,
    }
})

/**
 *  Set the field information for a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `fields`: the fields that the registrar concerns themselves with.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  # </weight>
 */
export type IdentitySetFieldsCall = {
    index: number,
    fields: bigint,
}

export const IdentitySetFieldsCall: sts.Type<IdentitySetFieldsCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        fields: sts.bigint(),
    }
})

/**
 *  Set the fee required for a judgement to be requested from a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `fee`: the new fee.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  # </weight>
 */
export type IdentitySetFeeCall = {
    index: number,
    fee: bigint,
}

export const IdentitySetFeeCall: sts.Type<IdentitySetFeeCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        fee: sts.bigint(),
    }
})

/**
 *  Request a judgement from a registrar.
 * 
 *  Payment: At most `max_fee` will be reserved for payment to the registrar if judgement
 *  given.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a
 *  registered identity.
 * 
 *  - `reg_index`: The index of the registrar whose judgement is requested.
 *  - `max_fee`: The maximum fee that may be paid. This should just be auto-populated as:
 * 
 *  ```nocompile
 *  Self::registrars(reg_index).uwnrap().fee
 *  ```
 * 
 *  Emits `JudgementRequested` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-reserve operation.
 *  - Storage: 1 read `O(R)`, 1 mutate `O(X + R)`.
 *  - One event.
 *  # </weight>
 */
export type IdentityRequestJudgementCall = {
    reg_index: number,
    max_fee: bigint,
}

export const IdentityRequestJudgementCall: sts.Type<IdentityRequestJudgementCall> = sts.struct(() => {
    return  {
        reg_index: sts.number(),
        max_fee: sts.bigint(),
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
 *  The dispatch origin for this call must be _Root_ or match `T::ForceOrigin`.
 * 
 *  - `target`: the account whose identity the judgement is upon. This must be an account
 *    with a registered identity.
 * 
 *  Emits `IdentityKilled` if successful.
 * 
 *  # <weight>
 *  - `O(R + S + X)`.
 *  - One balance-reserve operation.
 *  - Two storage mutations.
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
 *  Clear an account's identity info and all sub-account and return all deposits.
 * 
 *  Payment: All reserved balances on the account are returned.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  Emits `IdentityCleared` if successful.
 * 
 *  # <weight>
 *  - `O(R + S + X)`.
 *  - One balance-reserve operation.
 *  - Two storage mutations.
 *  - One event.
 *  # </weight>
 */
export type IdentityClearIdentityCall = null

export const IdentityClearIdentityCall: sts.Type<IdentityClearIdentityCall> = sts.unit()

/**
 *  Cancel a previous request.
 * 
 *  Payment: A previously reserved deposit is returned on success.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a
 *  registered identity.
 * 
 *  - `reg_index`: The index of the registrar whose judgement is no longer requested.
 * 
 *  Emits `JudgementUnrequested` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-reserve operation.
 *  - One storage mutation `O(R + X)`.
 *  - One event.
 *  # </weight>
 */
export type IdentityCancelRequestCall = {
    reg_index: RegistrarIndex,
}

export const IdentityCancelRequestCall: sts.Type<IdentityCancelRequestCall> = sts.struct(() => {
    return  {
        reg_index: RegistrarIndex,
    }
})

/**
 *  Add a registrar to the system.
 * 
 *  The dispatch origin for this call must be `RegistrarOrigin` or `Root`.
 * 
 *  - `account`: the account of the registrar.
 * 
 *  Emits `RegistrarAdded` if successful.
 * 
 *  # <weight>
 *  - `O(R)` where `R` registrar-count (governance-bounded).
 *  - One storage mutation (codec `O(R)`).
 *  - One event.
 *  # </weight>
 */
export type IdentityAddRegistrarCall = {
    account: AccountId,
}

export const IdentityAddRegistrarCall: sts.Type<IdentityAddRegistrarCall> = sts.struct(() => {
    return  {
        account: AccountId,
    }
})

/**
 *  A registrar was added.
 */
export type IdentityRegistrarAddedEvent = [RegistrarIndex]

export const IdentityRegistrarAddedEvent: sts.Type<IdentityRegistrarAddedEvent> = sts.tuple(() => RegistrarIndex)

/**
 *  A judgement request was retracted.
 */
export type IdentityJudgementUnrequestedEvent = [AccountId, RegistrarIndex]

export const IdentityJudgementUnrequestedEvent: sts.Type<IdentityJudgementUnrequestedEvent> = sts.tuple(() => AccountId, RegistrarIndex)

/**
 *  A judgement was asked from a registrar.
 */
export type IdentityJudgementRequestedEvent = [AccountId, RegistrarIndex]

export const IdentityJudgementRequestedEvent: sts.Type<IdentityJudgementRequestedEvent> = sts.tuple(() => AccountId, RegistrarIndex)

/**
 *  A judgement was given by a registrar.
 */
export type IdentityJudgementGivenEvent = [AccountId, RegistrarIndex]

export const IdentityJudgementGivenEvent: sts.Type<IdentityJudgementGivenEvent> = sts.tuple(() => AccountId, RegistrarIndex)

/**
 *  A name was set or reset (which will remove all judgements).
 */
export type IdentityIdentitySetEvent = [AccountId]

export const IdentityIdentitySetEvent: sts.Type<IdentityIdentitySetEvent> = sts.tuple(() => AccountId)

/**
 *  A name was removed and the given balance slashed.
 */
export type IdentityIdentityKilledEvent = [AccountId, Balance]

export const IdentityIdentityKilledEvent: sts.Type<IdentityIdentityKilledEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  A name was cleared, and the given balance returned.
 */
export type IdentityIdentityClearedEvent = [AccountId, Balance]

export const IdentityIdentityClearedEvent: sts.Type<IdentityIdentityClearedEvent> = sts.tuple(() => AccountId, Balance)
