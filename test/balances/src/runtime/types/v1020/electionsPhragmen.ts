import {sts} from '../../pallet.support'
import {AccountId, LookupSource, Balance} from './types'

/**
 *  Vote for a set of candidates for the upcoming round of election.
 * 
 *  The `votes` should:
 *    - not be empty.
 *    - be less than the number of candidates.
 * 
 *  Upon voting, `value` units of `who`'s balance is locked and a bond amount is reserved.
 *  It is the responsibility of the caller to not place all of their balance into the lock
 *  and keep some for further transactions.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(1)
 *  Writes: O(V) given `V` votes. V is bounded by 16.
 *  # </weight>
 */
export type ElectionsPhragmenVoteCall = {
    votes: AccountId[],
    value: bigint,
}

export const ElectionsPhragmenVoteCall: sts.Type<ElectionsPhragmenVoteCall> = sts.struct(() => {
    return  {
        votes: sts.array(() => AccountId),
        value: sts.bigint(),
    }
})

/**
 *  Submit oneself for candidacy.
 * 
 *  A candidate will either:
 *    - Lose at the end of the term and forfeit their deposit.
 *    - Win and become a member. Members will eventually get their stash back.
 *    - Become a runner-up. Runners-ups are reserved members in case one gets forcefully
 *      removed.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(LogN) Given N candidates.
 *  Writes: O(1)
 *  # </weight>
 */
export type ElectionsPhragmenSubmitCandidacyCall = null

export const ElectionsPhragmenSubmitCandidacyCall: sts.Type<ElectionsPhragmenSubmitCandidacyCall> = sts.unit()

/**
 *  Report `target` for being an defunct voter. In case of a valid report, the reporter is
 *  rewarded by the bond amount of `target`. Otherwise, the reporter itself is removed and
 *  their bond is slashed.
 * 
 *  A defunct voter is defined to be:
 *    - a voter whose current submitted votes are all invalid. i.e. all of them are no
 *      longer a candidate nor an active member.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(NLogM) given M current candidates and N votes for `target`.
 *  Writes: O(1)
 *  # </weight>
 */
export type ElectionsPhragmenReportDefunctVoterCall = {
    target: LookupSource,
}

export const ElectionsPhragmenReportDefunctVoterCall: sts.Type<ElectionsPhragmenReportDefunctVoterCall> = sts.struct(() => {
    return  {
        target: LookupSource,
    }
})

/**
 *  Renounce one's intention to be a candidate for the next election round. 3 potential
 *  outcomes exist:
 *  - `origin` is a candidate and not elected in any set. In this case, the bond is
 *    unreserved, returned and origin is removed as a candidate.
 *  - `origin` is a current runner up. In this case, the bond is unreserved, returned and
 *    origin is removed as a runner.
 *  - `origin` is a current member. In this case, the bond is unreserved and origin is
 *    removed as a member, consequently not being a candidate for the next round anymore.
 *    Similar to [`remove_voter`], if replacement runners exists, they are immediately used.
 */
export type ElectionsPhragmenRenounceCandidacyCall = null

export const ElectionsPhragmenRenounceCandidacyCall: sts.Type<ElectionsPhragmenRenounceCandidacyCall> = sts.unit()

/**
 *  Remove `origin` as a voter. This removes the lock and returns the bond.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(1)
 *  Writes: O(1)
 *  # </weight>
 */
export type ElectionsPhragmenRemoveVoterCall = null

export const ElectionsPhragmenRemoveVoterCall: sts.Type<ElectionsPhragmenRemoveVoterCall> = sts.unit()

/**
 *  Remove a particular member from the set. This is effective immediately and the bond of
 *  the outgoing member is slashed.
 * 
 *  If a runner-up is available, then the best runner-up will be removed and replaces the
 *  outgoing member. Otherwise, a new phragmen round is started.
 * 
 *  Note that this does not affect the designated block number of the next election.
 * 
 *  # <weight>
 *  #### State
 *  Reads: O(do_phragmen)
 *  Writes: O(do_phragmen)
 *  # </weight>
 */
export type ElectionsPhragmenRemoveMemberCall = {
    who: LookupSource,
}

export const ElectionsPhragmenRemoveMemberCall: sts.Type<ElectionsPhragmenRemoveMemberCall> = sts.struct(() => {
    return  {
        who: LookupSource,
    }
})

/**
 *  A voter (first element) was reported (byt the second element) with the the report being
 *  successful or not (third element).
 */
export type ElectionsPhragmenVoterReportedEvent = [AccountId, AccountId, boolean]

export const ElectionsPhragmenVoterReportedEvent: sts.Type<ElectionsPhragmenVoterReportedEvent> = sts.tuple(() => AccountId, AccountId, sts.boolean())

/**
 *  A new term with new members. This indicates that enough candidates existed, not that
 *  enough have has been elected. The inner value must be examined for this purpose.
 */
export type ElectionsPhragmenNewTermEvent = [[AccountId, Balance][]]

export const ElectionsPhragmenNewTermEvent: sts.Type<ElectionsPhragmenNewTermEvent> = sts.tuple(() => sts.array(() => sts.tuple(() => AccountId, Balance)))

/**
 *  A member has renounced their candidacy.
 */
export type ElectionsPhragmenMemberRenouncedEvent = [AccountId]

export const ElectionsPhragmenMemberRenouncedEvent: sts.Type<ElectionsPhragmenMemberRenouncedEvent> = sts.tuple(() => AccountId)

/**
 *  A member has been removed. This should always be followed by either `NewTerm` ot
 *  `EmptyTerm`.
 */
export type ElectionsPhragmenMemberKickedEvent = [AccountId]

export const ElectionsPhragmenMemberKickedEvent: sts.Type<ElectionsPhragmenMemberKickedEvent> = sts.tuple(() => AccountId)

/**
 *  No (or not enough) candidates existed for this round.
 */
export type ElectionsPhragmenEmptyTermEvent = null

export const ElectionsPhragmenEmptyTermEvent: sts.Type<ElectionsPhragmenEmptyTermEvent> = sts.unit()
