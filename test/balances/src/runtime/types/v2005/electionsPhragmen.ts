import {sts} from '../../pallet.support'
import {DefunctVoter, Renouncing, LookupSource} from './types'

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
 *  Base weight = 33.33 µs
 *  Complexity of candidate_count: 0.375 µs
 *  State reads:
 *  	- Candidates.len()
 *  	- Candidates
 *  	- Members
 *  	- RunnersUp
 *  	- [AccountBalance(who)]
 *  State writes:
 *  	- [AccountBalance(who)]
 *  	- Candidates
 *  # </weight>
 */
export type ElectionsPhragmenSubmitCandidacyCall = {
    candidate_count: number,
}

export const ElectionsPhragmenSubmitCandidacyCall: sts.Type<ElectionsPhragmenSubmitCandidacyCall> = sts.struct(() => {
    return  {
        candidate_count: sts.number(),
    }
})

/**
 *  Report `target` for being an defunct voter. In case of a valid report, the reporter is
 *  rewarded by the bond amount of `target`. Otherwise, the reporter itself is removed and
 *  their bond is slashed.
 * 
 *  A defunct voter is defined to be:
 *    - a voter whose current submitted votes are all invalid. i.e. all of them are no
 *      longer a candidate nor an active member or a runner-up.
 * 
 * 
 *  The origin must provide the number of current candidates and votes of the reported target
 *  for the purpose of accurate weight calculation.
 * 
 *  # <weight>
 *  No Base weight based on min square analysis.
 *  Complexity of candidate_count: 1.755 µs
 *  Complexity of vote_count: 18.51 µs
 *  State reads:
 *   	- Voting(reporter)
 *   	- Candidate.len()
 *   	- Voting(Target)
 *   	- Candidates, Members, RunnersUp (is_defunct_voter)
 *  State writes:
 *  	- Lock(reporter || target)
 *  	- [AccountBalance(reporter)] + AccountBalance(target)
 *  	- Voting(reporter || target)
 *  Note: the db access is worse with respect to db, which is when the report is correct.
 *  # </weight>
 */
export type ElectionsPhragmenReportDefunctVoterCall = {
    defunct: DefunctVoter,
}

export const ElectionsPhragmenReportDefunctVoterCall: sts.Type<ElectionsPhragmenReportDefunctVoterCall> = sts.struct(() => {
    return  {
        defunct: DefunctVoter,
    }
})

/**
 *  Renounce one's intention to be a candidate for the next election round. 3 potential
 *  outcomes exist:
 *  - `origin` is a candidate and not elected in any set. In this case, the bond is
 *    unreserved, returned and origin is removed as a candidate.
 *  - `origin` is a current runner-up. In this case, the bond is unreserved, returned and
 *    origin is removed as a runner-up.
 *  - `origin` is a current member. In this case, the bond is unreserved and origin is
 *    removed as a member, consequently not being a candidate for the next round anymore.
 *    Similar to [`remove_voter`], if replacement runners exists, they are immediately used.
 *  <weight>
 *  If a candidate is renouncing:
 *  	Base weight: 17.28 µs
 *  	Complexity of candidate_count: 0.235 µs
 *  	State reads:
 *  		- Candidates
 *  		- [AccountBalance(who) (unreserve)]
 *  	State writes:
 *  		- Candidates
 *  		- [AccountBalance(who) (unreserve)]
 *  If member is renouncing:
 *  	Base weight: 46.25 µs
 *  	State reads:
 *  		- Members, RunnersUp (remove_and_replace_member),
 *  		- [AccountData(who) (unreserve)]
 *  	State writes:
 *  		- Members, RunnersUp (remove_and_replace_member),
 *  		- [AccountData(who) (unreserve)]
 *  If runner is renouncing:
 *  	Base weight: 46.25 µs
 *  	State reads:
 *  		- RunnersUp (remove_and_replace_member),
 *  		- [AccountData(who) (unreserve)]
 *  	State writes:
 *  		- RunnersUp (remove_and_replace_member),
 *  		- [AccountData(who) (unreserve)]
 * 
 *  Weight note: The call into changeMembers need to be accounted for.
 *  </weight>
 */
export type ElectionsPhragmenRenounceCandidacyCall = {
    renouncing: Renouncing,
}

export const ElectionsPhragmenRenounceCandidacyCall: sts.Type<ElectionsPhragmenRenounceCandidacyCall> = sts.struct(() => {
    return  {
        renouncing: Renouncing,
    }
})

/**
 *  Remove a particular member from the set. This is effective immediately and the bond of
 *  the outgoing member is slashed.
 * 
 *  If a runner-up is available, then the best runner-up will be removed and replaces the
 *  outgoing member. Otherwise, a new phragmen election is started.
 * 
 *  Note that this does not affect the designated block number of the next election.
 * 
 *  # <weight>
 *  If we have a replacement:
 *  	- Base weight: 50.93 µs
 *  	- State reads:
 *  		- RunnersUp.len()
 *  		- Members, RunnersUp (remove_and_replace_member)
 *  	- State writes:
 *  		- Members, RunnersUp (remove_and_replace_member)
 *  Else, since this is a root call and will go into phragmen, we assume full block for now.
 *  # </weight>
 */
export type ElectionsPhragmenRemoveMemberCall = {
    who: LookupSource,
    has_replacement: boolean,
}

export const ElectionsPhragmenRemoveMemberCall: sts.Type<ElectionsPhragmenRemoveMemberCall> = sts.struct(() => {
    return  {
        who: LookupSource,
        has_replacement: sts.boolean(),
    }
})
