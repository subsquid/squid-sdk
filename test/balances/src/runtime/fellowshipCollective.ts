import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9320 from './types/v9320'

export const events = {
    MemberAdded: createEvent(
        'FellowshipCollective.MemberAdded',
        {
            v9320: v9320.FellowshipCollectiveMemberAddedEvent,
        }
    ),
    MemberRemoved: createEvent(
        'FellowshipCollective.MemberRemoved',
        {
            v9320: v9320.FellowshipCollectiveMemberRemovedEvent,
        }
    ),
    RankChanged: createEvent(
        'FellowshipCollective.RankChanged',
        {
            v9320: v9320.FellowshipCollectiveRankChangedEvent,
        }
    ),
    Voted: createEvent(
        'FellowshipCollective.Voted',
        {
            v9320: v9320.FellowshipCollectiveVotedEvent,
        }
    ),
}

export const calls = {
    add_member: createCall(
        'FellowshipCollective.add_member',
        {
            v9320: v9320.FellowshipCollectiveAddMemberCall,
        }
    ),
    cleanup_poll: createCall(
        'FellowshipCollective.cleanup_poll',
        {
            v9320: v9320.FellowshipCollectiveCleanupPollCall,
        }
    ),
    demote_member: createCall(
        'FellowshipCollective.demote_member',
        {
            v9320: v9320.FellowshipCollectiveDemoteMemberCall,
        }
    ),
    promote_member: createCall(
        'FellowshipCollective.promote_member',
        {
            v9320: v9320.FellowshipCollectivePromoteMemberCall,
        }
    ),
    remove_member: createCall(
        'FellowshipCollective.remove_member',
        {
            v9320: v9320.FellowshipCollectiveRemoveMemberCall,
        }
    ),
    vote: createCall(
        'FellowshipCollective.vote',
        {
            v9320: v9320.FellowshipCollectiveVoteCall,
        }
    ),
}

export const storage = {
    IdToIndex: createStorage(
        'FellowshipCollective.IdToIndex',
        {
            v9320: v9320.FellowshipCollectiveIdToIndexStorage,
        }
    ),
    IndexToId: createStorage(
        'FellowshipCollective.IndexToId',
        {
            v9320: v9320.FellowshipCollectiveIndexToIdStorage,
        }
    ),
    MemberCount: createStorage(
        'FellowshipCollective.MemberCount',
        {
            v9320: v9320.FellowshipCollectiveMemberCountStorage,
        }
    ),
    Members: createStorage(
        'FellowshipCollective.Members',
        {
            v9320: v9320.FellowshipCollectiveMembersStorage,
        }
    ),
    Voting: createStorage(
        'FellowshipCollective.Voting',
        {
            v9320: v9320.FellowshipCollectiveVotingStorage,
        }
    ),
    VotingCleanup: createStorage(
        'FellowshipCollective.VotingCleanup',
        {
            v9320: v9320.FellowshipCollectiveVotingCleanupStorage,
        }
    ),
}

export default {events, calls}
