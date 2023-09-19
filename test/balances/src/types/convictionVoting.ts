import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Delegated: createEvent(
        'ConvictionVoting.Delegated',
        {
            v9320: ConvictionVotingDelegatedEvent,
        }
    ),
    Undelegated: createEvent(
        'ConvictionVoting.Undelegated',
        {
            v9320: ConvictionVotingUndelegatedEvent,
        }
    ),
}

export const calls = {
    delegate: createCall(
        'ConvictionVoting.delegate',
        {
            v9320: ConvictionVotingDelegateCall,
        }
    ),
    remove_other_vote: createCall(
        'ConvictionVoting.remove_other_vote',
        {
            v9320: ConvictionVotingRemoveOtherVoteCall,
        }
    ),
    remove_vote: createCall(
        'ConvictionVoting.remove_vote',
        {
            v9320: ConvictionVotingRemoveVoteCall,
        }
    ),
    undelegate: createCall(
        'ConvictionVoting.undelegate',
        {
            v9320: ConvictionVotingUndelegateCall,
        }
    ),
    unlock: createCall(
        'ConvictionVoting.unlock',
        {
            v9320: ConvictionVotingUnlockCall,
        }
    ),
    vote: createCall(
        'ConvictionVoting.vote',
        {
            v9320: ConvictionVotingVoteCall,
            v9340: ConvictionVotingVoteCall,
        }
    ),
}

export const constants = {
    MaxVotes: createConstant(
        'ConvictionVoting.MaxVotes',
        {
            v9320: ConvictionVotingMaxVotesConstant,
        }
    ),
    VoteLockingPeriod: createConstant(
        'ConvictionVoting.VoteLockingPeriod',
        {
            v9320: ConvictionVotingVoteLockingPeriodConstant,
        }
    ),
}

export const storage = {
    ClassLocksFor: createStorage(
        'ConvictionVoting.ClassLocksFor',
        {
            v9320: ConvictionVotingClassLocksForStorage,
        }
    ),
    VotingFor: createStorage(
        'ConvictionVoting.VotingFor',
        {
            v9320: ConvictionVotingVotingForStorage,
            v9340: ConvictionVotingVotingForStorage,
        }
    ),
}

export default {events, calls, constants}
