import {sts} from '../../pallet.support'
import {MultiAddress, AccountId32, VoteRecord, Type_441} from './types'

/**
 * Add an aye or nay vote for the sender to the given proposal.
 * 
 * - `origin`: Must be `Signed` by a member account.
 * - `poll`: Index of a poll which is ongoing.
 * - `aye`: `true` if the vote is to approve the proposal, `false` otherwise.
 * 
 * Transaction fees are be waived if the member is voting on any particular proposal
 * for the first time and the call is successful. Subsequent vote changes will charge a
 * fee.
 * 
 * Weight: `O(1)`, less if there was no previous vote on the poll by the member.
 */
export type FellowshipCollectiveVoteCall = {
    poll: number,
    aye: boolean,
}

export const FellowshipCollectiveVoteCall: sts.Type<FellowshipCollectiveVoteCall> = sts.struct(() => {
    return  {
        poll: sts.number(),
        aye: sts.boolean(),
    }
})

/**
 * Remove the member entirely.
 * 
 * - `origin`: Must be the `AdminOrigin`.
 * - `who`: Account of existing member of rank greater than zero.
 * - `min_rank`: The rank of the member or greater.
 * 
 * Weight: `O(min_rank)`.
 */
export type FellowshipCollectiveRemoveMemberCall = {
    who: MultiAddress,
    minRank: number,
}

export const FellowshipCollectiveRemoveMemberCall: sts.Type<FellowshipCollectiveRemoveMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
        minRank: sts.number(),
    }
})

/**
 * Increment the rank of an existing member by one.
 * 
 * - `origin`: Must be the `AdminOrigin`.
 * - `who`: Account of existing member.
 * 
 * Weight: `O(1)`
 */
export type FellowshipCollectivePromoteMemberCall = {
    who: MultiAddress,
}

export const FellowshipCollectivePromoteMemberCall: sts.Type<FellowshipCollectivePromoteMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
    }
})

/**
 * Decrement the rank of an existing member by one. If the member is already at rank zero,
 * then they are removed entirely.
 * 
 * - `origin`: Must be the `AdminOrigin`.
 * - `who`: Account of existing member of rank greater than zero.
 * 
 * Weight: `O(1)`, less if the member's index is highest in its rank.
 */
export type FellowshipCollectiveDemoteMemberCall = {
    who: MultiAddress,
}

export const FellowshipCollectiveDemoteMemberCall: sts.Type<FellowshipCollectiveDemoteMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
    }
})

/**
 * Remove votes from the given poll. It must have ended.
 * 
 * - `origin`: Must be `Signed` by any account.
 * - `poll_index`: Index of a poll which is completed and for which votes continue to
 *   exist.
 * - `max`: Maximum number of vote items from remove in this call.
 * 
 * Transaction fees are waived if the operation is successful.
 * 
 * Weight `O(max)` (less if there are fewer items to remove than `max`).
 */
export type FellowshipCollectiveCleanupPollCall = {
    pollIndex: number,
    max: number,
}

export const FellowshipCollectiveCleanupPollCall: sts.Type<FellowshipCollectiveCleanupPollCall> = sts.struct(() => {
    return  {
        pollIndex: sts.number(),
        max: sts.number(),
    }
})

/**
 * Introduce a new member.
 * 
 * - `origin`: Must be the `AdminOrigin`.
 * - `who`: Account of non-member which will become a member.
 * - `rank`: The rank to give the new member.
 * 
 * Weight: `O(1)`
 */
export type FellowshipCollectiveAddMemberCall = {
    who: MultiAddress,
}

export const FellowshipCollectiveAddMemberCall: sts.Type<FellowshipCollectiveAddMemberCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
    }
})

/**
 * The member `who` has voted for the `poll` with the given `vote` leading to an updated
 * `tally`.
 */
export type FellowshipCollectiveVotedEvent = {
    who: AccountId32,
    poll: number,
    vote: VoteRecord,
    tally: Type_441,
}

export const FellowshipCollectiveVotedEvent: sts.Type<FellowshipCollectiveVotedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        poll: sts.number(),
        vote: VoteRecord,
        tally: Type_441,
    }
})

/**
 * The member `who`'s rank has been changed to the given `rank`.
 */
export type FellowshipCollectiveRankChangedEvent = {
    who: AccountId32,
    rank: number,
}

export const FellowshipCollectiveRankChangedEvent: sts.Type<FellowshipCollectiveRankChangedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        rank: sts.number(),
    }
})

/**
 * The member `who` of given `rank` has been removed from the collective.
 */
export type FellowshipCollectiveMemberRemovedEvent = {
    who: AccountId32,
    rank: number,
}

export const FellowshipCollectiveMemberRemovedEvent: sts.Type<FellowshipCollectiveMemberRemovedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        rank: sts.number(),
    }
})

/**
 * A member `who` has been added.
 */
export type FellowshipCollectiveMemberAddedEvent = {
    who: AccountId32,
}

export const FellowshipCollectiveMemberAddedEvent: sts.Type<FellowshipCollectiveMemberAddedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
    }
})
