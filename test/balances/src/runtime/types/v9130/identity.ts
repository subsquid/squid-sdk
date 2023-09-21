import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A sub-identity was cleared, and the given deposit repatriated from the
 * main identity account to the sub-identity account.
 */
export type IdentitySubIdentityRevokedEvent = {
    sub: AccountId32,
    main: AccountId32,
    deposit: bigint,
}

export const IdentitySubIdentityRevokedEvent: sts.Type<IdentitySubIdentityRevokedEvent> = sts.struct(() => {
    return  {
        sub: AccountId32,
        main: AccountId32,
        deposit: sts.bigint(),
    }
})

/**
 * A sub-identity was removed from an identity and the deposit freed.
 */
export type IdentitySubIdentityRemovedEvent = {
    sub: AccountId32,
    main: AccountId32,
    deposit: bigint,
}

export const IdentitySubIdentityRemovedEvent: sts.Type<IdentitySubIdentityRemovedEvent> = sts.struct(() => {
    return  {
        sub: AccountId32,
        main: AccountId32,
        deposit: sts.bigint(),
    }
})

/**
 * A sub-identity was added to an identity and the deposit paid.
 */
export type IdentitySubIdentityAddedEvent = {
    sub: AccountId32,
    main: AccountId32,
    deposit: bigint,
}

export const IdentitySubIdentityAddedEvent: sts.Type<IdentitySubIdentityAddedEvent> = sts.struct(() => {
    return  {
        sub: AccountId32,
        main: AccountId32,
        deposit: sts.bigint(),
    }
})

/**
 * A registrar was added.
 */
export type IdentityRegistrarAddedEvent = {
    registrarIndex: number,
}

export const IdentityRegistrarAddedEvent: sts.Type<IdentityRegistrarAddedEvent> = sts.struct(() => {
    return  {
        registrarIndex: sts.number(),
    }
})

/**
 * A judgement request was retracted.
 */
export type IdentityJudgementUnrequestedEvent = {
    who: AccountId32,
    registrarIndex: number,
}

export const IdentityJudgementUnrequestedEvent: sts.Type<IdentityJudgementUnrequestedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        registrarIndex: sts.number(),
    }
})

/**
 * A judgement was asked from a registrar.
 */
export type IdentityJudgementRequestedEvent = {
    who: AccountId32,
    registrarIndex: number,
}

export const IdentityJudgementRequestedEvent: sts.Type<IdentityJudgementRequestedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        registrarIndex: sts.number(),
    }
})

/**
 * A judgement was given by a registrar.
 */
export type IdentityJudgementGivenEvent = {
    target: AccountId32,
    registrarIndex: number,
}

export const IdentityJudgementGivenEvent: sts.Type<IdentityJudgementGivenEvent> = sts.struct(() => {
    return  {
        target: AccountId32,
        registrarIndex: sts.number(),
    }
})

/**
 * A name was set or reset (which will remove all judgements).
 */
export type IdentityIdentitySetEvent = {
    who: AccountId32,
}

export const IdentityIdentitySetEvent: sts.Type<IdentityIdentitySetEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
    }
})

/**
 * A name was removed and the given balance slashed.
 */
export type IdentityIdentityKilledEvent = {
    who: AccountId32,
    deposit: bigint,
}

export const IdentityIdentityKilledEvent: sts.Type<IdentityIdentityKilledEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        deposit: sts.bigint(),
    }
})

/**
 * A name was cleared, and the given balance returned.
 */
export type IdentityIdentityClearedEvent = {
    who: AccountId32,
    deposit: bigint,
}

export const IdentityIdentityClearedEvent: sts.Type<IdentityIdentityClearedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        deposit: sts.bigint(),
    }
})
