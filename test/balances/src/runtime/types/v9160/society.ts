import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A membership bid just happened by vouching. The given account is the candidate's ID and
 * their offer is the second. The vouching party is the third.
 */
export type SocietyVouchEvent = {
    candidateId: AccountId32,
    offer: bigint,
    vouching: AccountId32,
}

export const SocietyVouchEvent: sts.Type<SocietyVouchEvent> = sts.struct(() => {
    return  {
        candidateId: AccountId32,
        offer: sts.bigint(),
        vouching: AccountId32,
    }
})

/**
 * A vote has been placed
 */
export type SocietyVoteEvent = {
    candidate: AccountId32,
    voter: AccountId32,
    vote: boolean,
}

export const SocietyVoteEvent: sts.Type<SocietyVoteEvent> = sts.struct(() => {
    return  {
        candidate: AccountId32,
        voter: AccountId32,
        vote: sts.boolean(),
    }
})

/**
 * A candidate was dropped (by request of who vouched for them).
 */
export type SocietyUnvouchEvent = {
    candidate: AccountId32,
}

export const SocietyUnvouchEvent: sts.Type<SocietyUnvouchEvent> = sts.struct(() => {
    return  {
        candidate: AccountId32,
    }
})

/**
 * Society is unfounded.
 */
export type SocietyUnfoundedEvent = {
    founder: AccountId32,
}

export const SocietyUnfoundedEvent: sts.Type<SocietyUnfoundedEvent> = sts.struct(() => {
    return  {
        founder: AccountId32,
    }
})

/**
 * A candidate was dropped (by their request).
 */
export type SocietyUnbidEvent = {
    candidate: AccountId32,
}

export const SocietyUnbidEvent: sts.Type<SocietyUnbidEvent> = sts.struct(() => {
    return  {
        candidate: AccountId32,
    }
})

/**
 * A suspended member has been judged.
 */
export type SocietySuspendedMemberJudgementEvent = {
    who: AccountId32,
    judged: boolean,
}

export const SocietySuspendedMemberJudgementEvent: sts.Type<SocietySuspendedMemberJudgementEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        judged: sts.boolean(),
    }
})

/**
 * A new \[max\] member count has been set
 */
export type SocietyNewMaxMembersEvent = {
    max: number,
}

export const SocietyNewMaxMembersEvent: sts.Type<SocietyNewMaxMembersEvent> = sts.struct(() => {
    return  {
        max: sts.number(),
    }
})

/**
 * A member has been suspended
 */
export type SocietyMemberSuspendedEvent = {
    member: AccountId32,
}

export const SocietyMemberSuspendedEvent: sts.Type<SocietyMemberSuspendedEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
    }
})

/**
 * A group of candidates have been inducted. The batch's primary is the first value, the
 * batch in full is the second.
 */
export type SocietyInductedEvent = {
    primary: AccountId32,
    candidates: AccountId32[],
}

export const SocietyInductedEvent: sts.Type<SocietyInductedEvent> = sts.struct(() => {
    return  {
        primary: AccountId32,
        candidates: sts.array(() => AccountId32),
    }
})

/**
 * The society is founded by the given identity.
 */
export type SocietyFoundedEvent = {
    founder: AccountId32,
}

export const SocietyFoundedEvent: sts.Type<SocietyFoundedEvent> = sts.struct(() => {
    return  {
        founder: AccountId32,
    }
})

/**
 * Some funds were deposited into the society account.
 */
export type SocietyDepositEvent = {
    value: bigint,
}

export const SocietyDepositEvent: sts.Type<SocietyDepositEvent> = sts.struct(() => {
    return  {
        value: sts.bigint(),
    }
})

/**
 * A vote has been placed for a defending member
 */
export type SocietyDefenderVoteEvent = {
    voter: AccountId32,
    vote: boolean,
}

export const SocietyDefenderVoteEvent: sts.Type<SocietyDefenderVoteEvent> = sts.struct(() => {
    return  {
        voter: AccountId32,
        vote: sts.boolean(),
    }
})

/**
 * A member has been challenged
 */
export type SocietyChallengedEvent = {
    member: AccountId32,
}

export const SocietyChallengedEvent: sts.Type<SocietyChallengedEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
    }
})

/**
 * A candidate has been suspended
 */
export type SocietyCandidateSuspendedEvent = {
    candidate: AccountId32,
}

export const SocietyCandidateSuspendedEvent: sts.Type<SocietyCandidateSuspendedEvent> = sts.struct(() => {
    return  {
        candidate: AccountId32,
    }
})

/**
 * A membership bid just happened. The given account is the candidate's ID and their offer
 * is the second.
 */
export type SocietyBidEvent = {
    candidateId: AccountId32,
    offer: bigint,
}

export const SocietyBidEvent: sts.Type<SocietyBidEvent> = sts.struct(() => {
    return  {
        candidateId: AccountId32,
        offer: sts.bigint(),
    }
})

/**
 * A candidate was dropped (due to an excess of bids in the system).
 */
export type SocietyAutoUnbidEvent = {
    candidate: AccountId32,
}

export const SocietyAutoUnbidEvent: sts.Type<SocietyAutoUnbidEvent> = sts.struct(() => {
    return  {
        candidate: AccountId32,
    }
})
