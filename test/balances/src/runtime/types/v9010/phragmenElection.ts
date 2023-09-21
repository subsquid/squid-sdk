import {sts} from '../../pallet.support'
import {AccountId, Renouncing, LookupSource, Balance} from './types'

/**
 *  Vote for a set of candidates for the upcoming round of election. This can be called to
 *  set the initial votes, or update already existing votes.
 * 
 *  Upon initial voting, `value` units of `who`'s balance is locked and a deposit amount is
 *  reserved. The deposit is based on the number of votes and can be updated over time.
 * 
 *  The `votes` should:
 *    - not be empty.
 *    - be less than the number of possible candidates. Note that all current members and
 *      runners-up are also automatically candidates for the next round.
 * 
 *  If `value` is more than `who`'s total balance, then the maximum of the two is used.
 * 
 *  The dispatch origin of this call must be signed.
 * 
 *  ### Warning
 * 
 *  It is the responsibility of the caller to **NOT** place all of their balance into the
 *  lock and keep some for further operations.
 * 
 *  # <weight>
 *  We assume the maximum weight among all 3 cases: vote_equal, vote_more and vote_less.
 *  # </weight>
 */
export type PhragmenElectionVoteCall = {
    votes: AccountId[],
    value: bigint,
}

export const PhragmenElectionVoteCall: sts.Type<PhragmenElectionVoteCall> = sts.struct(() => {
    return  {
        votes: sts.array(() => AccountId),
        value: sts.bigint(),
    }
})

/**
 *  Submit oneself for candidacy. A fixed amount of deposit is recorded.
 * 
 *  All candidates are wiped at the end of the term. They either become a member/runner-up,
 *  or leave the system while their deposit is slashed.
 * 
 *  The dispatch origin of this call must be signed.
 * 
 *  ### Warning
 * 
 *  Even if a candidate ends up being a member, they must call [`Call::renounce_candidacy`]
 *  to get their deposit back. Losing the spot in an election will always lead to a slash.
 * 
 *  # <weight>
 *  The number of current candidates must be provided as witness data.
 *  # </weight>
 */
export type PhragmenElectionSubmitCandidacyCall = {
    candidate_count: number,
}

export const PhragmenElectionSubmitCandidacyCall: sts.Type<PhragmenElectionSubmitCandidacyCall> = sts.struct(() => {
    return  {
        candidate_count: sts.number(),
    }
})

/**
 *  Renounce one's intention to be a candidate for the next election round. 3 potential
 *  outcomes exist:
 * 
 *  - `origin` is a candidate and not elected in any set. In this case, the deposit is
 *    unreserved, returned and origin is removed as a candidate.
 *  - `origin` is a current runner-up. In this case, the deposit is unreserved, returned and
 *    origin is removed as a runner-up.
 *  - `origin` is a current member. In this case, the deposit is unreserved and origin is
 *    removed as a member, consequently not being a candidate for the next round anymore.
 *    Similar to [`remove_members`], if replacement runners exists, they are immediately
 *    used. If the prime is renouncing, then no prime will exist until the next round.
 * 
 *  The dispatch origin of this call must be signed, and have one of the above roles.
 * 
 *  # <weight>
 *  The type of renouncing must be provided as witness data.
 *  # </weight>
 */
export type PhragmenElectionRenounceCandidacyCall = {
    renouncing: Renouncing,
}

export const PhragmenElectionRenounceCandidacyCall: sts.Type<PhragmenElectionRenounceCandidacyCall> = sts.struct(() => {
    return  {
        renouncing: Renouncing,
    }
})

/**
 *  Remove `origin` as a voter.
 * 
 *  This removes the lock and returns the deposit.
 * 
 *  The dispatch origin of this call must be signed and be a voter.
 */
export type PhragmenElectionRemoveVoterCall = null

export const PhragmenElectionRemoveVoterCall: sts.Type<PhragmenElectionRemoveVoterCall> = sts.unit()

/**
 *  Remove a particular member from the set. This is effective immediately and the bond of
 *  the outgoing member is slashed.
 * 
 *  If a runner-up is available, then the best runner-up will be removed and replaces the
 *  outgoing member. Otherwise, a new phragmen election is started.
 * 
 *  The dispatch origin of this call must be root.
 * 
 *  Note that this does not affect the designated block number of the next election.
 * 
 *  # <weight>
 *  If we have a replacement, we use a small weight. Else, since this is a root call and
 *  will go into phragmen, we assume full block for now.
 *  # </weight>
 */
export type PhragmenElectionRemoveMemberCall = {
    who: LookupSource,
    has_replacement: boolean,
}

export const PhragmenElectionRemoveMemberCall: sts.Type<PhragmenElectionRemoveMemberCall> = sts.struct(() => {
    return  {
        who: LookupSource,
        has_replacement: sts.boolean(),
    }
})

/**
 *  Clean all voters who are defunct (i.e. they do not serve any purpose at all). The
 *  deposit of the removed voters are returned.
 * 
 *  This is an root function to be used only for cleaning the state.
 * 
 *  The dispatch origin of this call must be root.
 * 
 *  # <weight>
 *  The total number of voters and those that are defunct must be provided as witness data.
 *  # </weight>
 */
export type PhragmenElectionCleanDefunctVotersCall = {
    _num_voters: number,
    _num_defunct: number,
}

export const PhragmenElectionCleanDefunctVotersCall: sts.Type<PhragmenElectionCleanDefunctVotersCall> = sts.struct(() => {
    return  {
        _num_voters: sts.number(),
        _num_defunct: sts.number(),
    }
})

/**
 *  A \[seat holder\] was slashed by \[amount\] by being forcefully removed from the set.
 */
export type PhragmenElectionSeatHolderSlashedEvent = [AccountId, Balance]

export const PhragmenElectionSeatHolderSlashedEvent: sts.Type<PhragmenElectionSeatHolderSlashedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  Someone has renounced their candidacy.
 */
export type PhragmenElectionRenouncedEvent = [AccountId]

export const PhragmenElectionRenouncedEvent: sts.Type<PhragmenElectionRenouncedEvent> = sts.tuple(() => AccountId)

/**
 *  A new term with \[new_members\]. This indicates that enough candidates existed to run
 *  the election, not that enough have has been elected. The inner value must be examined
 *  for this purpose. A `NewTerm(\[\])` indicates that some candidates got their bond
 *  slashed and none were elected, whilst `EmptyTerm` means that no candidates existed to
 *  begin with.
 */
export type PhragmenElectionNewTermEvent = [[AccountId, Balance][]]

export const PhragmenElectionNewTermEvent: sts.Type<PhragmenElectionNewTermEvent> = sts.tuple(() => sts.array(() => sts.tuple(() => AccountId, Balance)))

/**
 *  A \[member\] has been removed. This should always be followed by either `NewTerm` or
 *  `EmptyTerm`.
 */
export type PhragmenElectionMemberKickedEvent = [AccountId]

export const PhragmenElectionMemberKickedEvent: sts.Type<PhragmenElectionMemberKickedEvent> = sts.tuple(() => AccountId)

/**
 *  No (or not enough) candidates existed for this round. This is different from
 *  `NewTerm(\[\])`. See the description of `NewTerm`.
 */
export type PhragmenElectionEmptyTermEvent = null

export const PhragmenElectionEmptyTermEvent: sts.Type<PhragmenElectionEmptyTermEvent> = sts.unit()

/**
 *  Internal error happened while trying to perform election.
 */
export type PhragmenElectionElectionErrorEvent = null

export const PhragmenElectionElectionErrorEvent: sts.Type<PhragmenElectionElectionErrorEvent> = sts.unit()

/**
 *  A \[candidate\] was slashed by \[amount\] due to failing to obtain a seat as member or
 *  runner-up.
 * 
 *  Note that old members and runners-up are also candidates.
 */
export type PhragmenElectionCandidateSlashedEvent = [AccountId, Balance]

export const PhragmenElectionCandidateSlashedEvent: sts.Type<PhragmenElectionCandidateSlashedEvent> = sts.tuple(() => AccountId, Balance)
