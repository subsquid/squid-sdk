import {sts} from '../../pallet.support'
import {MultiAddress, AccountId32} from './types'

/**
 * As a member, vote on a candidate.
 * 
 * The dispatch origin for this call must be _Signed_ and a member.
 * 
 * Parameters:
 * - `candidate`: The candidate that the member would like to bid on.
 * - `approve`: A boolean which says if the candidate should be approved (`true`) or
 *   rejected (`false`).
 * 
 * # <weight>
 * Key: C (len of candidates), M (len of members)
 * - One storage read O(M) and O(log M) search to check user is a member.
 * - One account lookup.
 * - One storage read O(C) and O(C) search to check that user is a candidate.
 * - One storage write to add vote to votes. O(1)
 * - One event.
 * 
 * Total Complexity: O(M + logM + C)
 * # </weight>
 */
export type SocietyVoteCall = {
    candidate: MultiAddress,
    approve: boolean,
}

export const SocietyVoteCall: sts.Type<SocietyVoteCall> = sts.struct(() => {
    return  {
        candidate: MultiAddress,
        approve: sts.boolean(),
    }
})

/**
 * Found the society.
 * 
 * This is done as a discrete action in order to allow for the
 * pallet to be included into a running chain and can only be done once.
 * 
 * The dispatch origin for this call must be from the _FounderSetOrigin_.
 * 
 * Parameters:
 * - `founder` - The first member and head of the newly founded society.
 * - `max_members` - The initial max number of members for the society.
 * - `rules` - The rules of this society concerning membership.
 * 
 * # <weight>
 * - Two storage mutates to set `Head` and `Founder`. O(1)
 * - One storage write to add the first member to society. O(1)
 * - One event.
 * 
 * Total Complexity: O(1)
 * # </weight>
 */
export type SocietyFoundCall = {
    founder: AccountId32,
    maxMembers: number,
    rules: Bytes,
}

export const SocietyFoundCall: sts.Type<SocietyFoundCall> = sts.struct(() => {
    return  {
        founder: AccountId32,
        maxMembers: sts.number(),
        rules: sts.bytes(),
    }
})
