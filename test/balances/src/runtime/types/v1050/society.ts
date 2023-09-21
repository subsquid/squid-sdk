import {sts} from '../../pallet.support'
import {LookupSource} from './types'

/**
 *  As a member, vote on a candidate.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `candidate`: The candidate that the member would like to bid on.
 *  - `approve`: A boolean which says if the candidate should be
 *               approved (`true`) or rejected (`false`).
 * 
 *  # <weight>
 *  Key: C (len of candidates), M (len of members)
 *  - One storage read O(M) and O(log M) search to check user is a member.
 *  - One account lookup.
 *  - One storage read O(C) and O(C) search to check that user is a candidate.
 *  - One storage write to add vote to votes. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(M + logM + C)
 *  # </weight>
 */
export type SocietyVoteCall = {
    candidate: LookupSource,
    approve: boolean,
}

export const SocietyVoteCall: sts.Type<SocietyVoteCall> = sts.struct(() => {
    return  {
        candidate: LookupSource,
        approve: sts.boolean(),
    }
})
