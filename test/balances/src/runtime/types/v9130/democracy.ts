import {sts} from '../../pallet.support'
import {AccountId32, H256, VoteThreshold, Type_49} from './types'

/**
 * An external proposal has been vetoed.
 */
export type DemocracyVetoedEvent = {
    who: AccountId32,
    proposalHash: H256,
    until: number,
}

export const DemocracyVetoedEvent: sts.Type<DemocracyVetoedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        proposalHash: H256,
        until: sts.number(),
    }
})

/**
 * An account has cancelled a previous delegation operation.
 */
export type DemocracyUndelegatedEvent = {
    account: AccountId32,
}

export const DemocracyUndelegatedEvent: sts.Type<DemocracyUndelegatedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
    }
})

/**
 * A public proposal has been tabled for referendum vote.
 */
export type DemocracyTabledEvent = {
    proposalIndex: number,
    deposit: bigint,
    depositors: AccountId32[],
}

export const DemocracyTabledEvent: sts.Type<DemocracyTabledEvent> = sts.struct(() => {
    return  {
        proposalIndex: sts.number(),
        deposit: sts.bigint(),
        depositors: sts.array(() => AccountId32),
    }
})

/**
 * A referendum has begun.
 */
export type DemocracyStartedEvent = {
    refIndex: number,
    threshold: VoteThreshold,
}

export const DemocracyStartedEvent: sts.Type<DemocracyStartedEvent> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
        threshold: VoteThreshold,
    }
})

/**
 * A motion has been proposed by a public account.
 */
export type DemocracyProposedEvent = {
    proposalIndex: number,
    deposit: bigint,
}

export const DemocracyProposedEvent: sts.Type<DemocracyProposedEvent> = sts.struct(() => {
    return  {
        proposalIndex: sts.number(),
        deposit: sts.bigint(),
    }
})

/**
 * A proposal preimage was removed and used (the deposit was returned).
 */
export type DemocracyPreimageUsedEvent = {
    proposalHash: H256,
    provider: AccountId32,
    deposit: bigint,
}

export const DemocracyPreimageUsedEvent: sts.Type<DemocracyPreimageUsedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        provider: AccountId32,
        deposit: sts.bigint(),
    }
})

/**
 * A registered preimage was removed and the deposit collected by the reaper.
 */
export type DemocracyPreimageReapedEvent = {
    proposalHash: H256,
    provider: AccountId32,
    deposit: bigint,
    reaper: AccountId32,
}

export const DemocracyPreimageReapedEvent: sts.Type<DemocracyPreimageReapedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        provider: AccountId32,
        deposit: sts.bigint(),
        reaper: AccountId32,
    }
})

/**
 * A proposal's preimage was noted, and the deposit taken.
 */
export type DemocracyPreimageNotedEvent = {
    proposalHash: H256,
    who: AccountId32,
    deposit: bigint,
}

export const DemocracyPreimageNotedEvent: sts.Type<DemocracyPreimageNotedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        who: AccountId32,
        deposit: sts.bigint(),
    }
})

/**
 * A proposal could not be executed because its preimage was missing.
 */
export type DemocracyPreimageMissingEvent = {
    proposalHash: H256,
    refIndex: number,
}

export const DemocracyPreimageMissingEvent: sts.Type<DemocracyPreimageMissingEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        refIndex: sts.number(),
    }
})

/**
 * A proposal could not be executed because its preimage was invalid.
 */
export type DemocracyPreimageInvalidEvent = {
    proposalHash: H256,
    refIndex: number,
}

export const DemocracyPreimageInvalidEvent: sts.Type<DemocracyPreimageInvalidEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        refIndex: sts.number(),
    }
})

/**
 * A proposal has been approved by referendum.
 */
export type DemocracyPassedEvent = {
    refIndex: number,
}

export const DemocracyPassedEvent: sts.Type<DemocracyPassedEvent> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
    }
})

/**
 * A proposal has been rejected by referendum.
 */
export type DemocracyNotPassedEvent = {
    refIndex: number,
}

export const DemocracyNotPassedEvent: sts.Type<DemocracyNotPassedEvent> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
    }
})

/**
 * A proposal has been enacted.
 */
export type DemocracyExecutedEvent = {
    refIndex: number,
    result: Type_49,
}

export const DemocracyExecutedEvent: sts.Type<DemocracyExecutedEvent> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
        result: Type_49,
    }
})

/**
 * An account has delegated their vote to another account.
 */
export type DemocracyDelegatedEvent = {
    who: AccountId32,
    target: AccountId32,
}

export const DemocracyDelegatedEvent: sts.Type<DemocracyDelegatedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        target: AccountId32,
    }
})

/**
 * A referendum has been cancelled.
 */
export type DemocracyCancelledEvent = {
    refIndex: number,
}

export const DemocracyCancelledEvent: sts.Type<DemocracyCancelledEvent> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
    }
})

/**
 * A proposal_hash has been blacklisted permanently.
 */
export type DemocracyBlacklistedEvent = {
    proposalHash: H256,
}

export const DemocracyBlacklistedEvent: sts.Type<DemocracyBlacklistedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
    }
})
