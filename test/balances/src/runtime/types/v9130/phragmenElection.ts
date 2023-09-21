import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A seat holder was slashed by amount by being forcefully removed from the set.
 */
export type PhragmenElectionSeatHolderSlashedEvent = {
    seatHolder: AccountId32,
    amount: bigint,
}

export const PhragmenElectionSeatHolderSlashedEvent: sts.Type<PhragmenElectionSeatHolderSlashedEvent> = sts.struct(() => {
    return  {
        seatHolder: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Someone has renounced their candidacy.
 */
export type PhragmenElectionRenouncedEvent = {
    candidate: AccountId32,
}

export const PhragmenElectionRenouncedEvent: sts.Type<PhragmenElectionRenouncedEvent> = sts.struct(() => {
    return  {
        candidate: AccountId32,
    }
})

/**
 * A new term with new_members. This indicates that enough candidates existed to run
 * the election, not that enough have has been elected. The inner value must be examined
 * for this purpose. A `NewTerm(\[\])` indicates that some candidates got their bond
 * slashed and none were elected, whilst `EmptyTerm` means that no candidates existed to
 * begin with.
 */
export type PhragmenElectionNewTermEvent = {
    newMembers: [AccountId32, bigint][],
}

export const PhragmenElectionNewTermEvent: sts.Type<PhragmenElectionNewTermEvent> = sts.struct(() => {
    return  {
        newMembers: sts.array(() => sts.tuple(() => AccountId32, sts.bigint())),
    }
})

/**
 * A member has been removed. This should always be followed by either `NewTerm` or
 * `EmptyTerm`.
 */
export type PhragmenElectionMemberKickedEvent = {
    member: AccountId32,
}

export const PhragmenElectionMemberKickedEvent: sts.Type<PhragmenElectionMemberKickedEvent> = sts.struct(() => {
    return  {
        member: AccountId32,
    }
})

/**
 * A candidate was slashed by amount due to failing to obtain a seat as member or
 * runner-up.
 * 
 * Note that old members and runners-up are also candidates.
 */
export type PhragmenElectionCandidateSlashedEvent = {
    candidate: AccountId32,
    amount: bigint,
}

export const PhragmenElectionCandidateSlashedEvent: sts.Type<PhragmenElectionCandidateSlashedEvent> = sts.struct(() => {
    return  {
        candidate: AccountId32,
        amount: sts.bigint(),
    }
})
