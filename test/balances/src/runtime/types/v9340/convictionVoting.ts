import {sts} from '../../pallet.support'
import {Type_144} from './types'

/**
 * Vote in a poll. If `vote.is_aye()`, the vote is to enact the proposal;
 * otherwise it is a vote to keep the status quo.
 * 
 * The dispatch origin of this call must be _Signed_.
 * 
 * - `poll_index`: The index of the poll to vote for.
 * - `vote`: The vote configuration.
 * 
 * Weight: `O(R)` where R is the number of polls the voter has voted on.
 */
export type ConvictionVotingVoteCall = {
    pollIndex: number,
    vote: Type_144,
}

export const ConvictionVotingVoteCall: sts.Type<ConvictionVotingVoteCall> = sts.struct(() => {
    return  {
        pollIndex: sts.number(),
        vote: Type_144,
    }
})
