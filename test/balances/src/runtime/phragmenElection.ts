import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9280 from './types/v9280'
import * as v9271 from './types/v9271'
import * as v9130 from './types/v9130'
import * as v9111 from './types/v9111'
import * as v9010 from './types/v9010'

export const events = {
    CandidateSlashed: createEvent(
        'PhragmenElection.CandidateSlashed',
        {
            v9010: v9010.PhragmenElectionCandidateSlashedEvent,
            v9130: v9130.PhragmenElectionCandidateSlashedEvent,
        }
    ),
    ElectionError: createEvent(
        'PhragmenElection.ElectionError',
        {
            v9010: v9010.PhragmenElectionElectionErrorEvent,
        }
    ),
    EmptyTerm: createEvent(
        'PhragmenElection.EmptyTerm',
        {
            v9010: v9010.PhragmenElectionEmptyTermEvent,
        }
    ),
    MemberKicked: createEvent(
        'PhragmenElection.MemberKicked',
        {
            v9010: v9010.PhragmenElectionMemberKickedEvent,
            v9130: v9130.PhragmenElectionMemberKickedEvent,
        }
    ),
    NewTerm: createEvent(
        'PhragmenElection.NewTerm',
        {
            v9010: v9010.PhragmenElectionNewTermEvent,
            v9130: v9130.PhragmenElectionNewTermEvent,
        }
    ),
    Renounced: createEvent(
        'PhragmenElection.Renounced',
        {
            v9010: v9010.PhragmenElectionRenouncedEvent,
            v9130: v9130.PhragmenElectionRenouncedEvent,
        }
    ),
    SeatHolderSlashed: createEvent(
        'PhragmenElection.SeatHolderSlashed',
        {
            v9010: v9010.PhragmenElectionSeatHolderSlashedEvent,
            v9130: v9130.PhragmenElectionSeatHolderSlashedEvent,
        }
    ),
}

export const calls = {
    clean_defunct_voters: createCall(
        'PhragmenElection.clean_defunct_voters',
        {
            v9010: v9010.PhragmenElectionCleanDefunctVotersCall,
            v9111: v9111.PhragmenElectionCleanDefunctVotersCall,
        }
    ),
    remove_member: createCall(
        'PhragmenElection.remove_member',
        {
            v9010: v9010.PhragmenElectionRemoveMemberCall,
            v9111: v9111.PhragmenElectionRemoveMemberCall,
            v9271: v9271.PhragmenElectionRemoveMemberCall,
        }
    ),
    remove_voter: createCall(
        'PhragmenElection.remove_voter',
        {
            v9010: v9010.PhragmenElectionRemoveVoterCall,
        }
    ),
    renounce_candidacy: createCall(
        'PhragmenElection.renounce_candidacy',
        {
            v9010: v9010.PhragmenElectionRenounceCandidacyCall,
        }
    ),
    submit_candidacy: createCall(
        'PhragmenElection.submit_candidacy',
        {
            v9010: v9010.PhragmenElectionSubmitCandidacyCall,
            v9111: v9111.PhragmenElectionSubmitCandidacyCall,
        }
    ),
    vote: createCall(
        'PhragmenElection.vote',
        {
            v9010: v9010.PhragmenElectionVoteCall,
        }
    ),
}

export const constants = {
    CandidacyBond: createConstant(
        'PhragmenElection.CandidacyBond',
        {
            v9010: v9010.PhragmenElectionCandidacyBondConstant,
        }
    ),
    DesiredMembers: createConstant(
        'PhragmenElection.DesiredMembers',
        {
            v9010: v9010.PhragmenElectionDesiredMembersConstant,
        }
    ),
    DesiredRunnersUp: createConstant(
        'PhragmenElection.DesiredRunnersUp',
        {
            v9010: v9010.PhragmenElectionDesiredRunnersUpConstant,
        }
    ),
    MaxCandidates: createConstant(
        'PhragmenElection.MaxCandidates',
        {
            v9280: v9280.PhragmenElectionMaxCandidatesConstant,
        }
    ),
    MaxVoters: createConstant(
        'PhragmenElection.MaxVoters',
        {
            v9280: v9280.PhragmenElectionMaxVotersConstant,
        }
    ),
    PalletId: createConstant(
        'PhragmenElection.PalletId',
        {
            v9010: v9010.PhragmenElectionPalletIdConstant,
        }
    ),
    TermDuration: createConstant(
        'PhragmenElection.TermDuration',
        {
            v9010: v9010.PhragmenElectionTermDurationConstant,
        }
    ),
    VotingBondBase: createConstant(
        'PhragmenElection.VotingBondBase',
        {
            v9010: v9010.PhragmenElectionVotingBondBaseConstant,
        }
    ),
    VotingBondFactor: createConstant(
        'PhragmenElection.VotingBondFactor',
        {
            v9010: v9010.PhragmenElectionVotingBondFactorConstant,
        }
    ),
}

export const storage = {
    Candidates: createStorage(
        'PhragmenElection.Candidates',
        {
            v9010: v9010.PhragmenElectionCandidatesStorage,
        }
    ),
    ElectionRounds: createStorage(
        'PhragmenElection.ElectionRounds',
        {
            v9010: v9010.PhragmenElectionElectionRoundsStorage,
        }
    ),
    Members: createStorage(
        'PhragmenElection.Members',
        {
            v9010: v9010.PhragmenElectionMembersStorage,
        }
    ),
    RunnersUp: createStorage(
        'PhragmenElection.RunnersUp',
        {
            v9010: v9010.PhragmenElectionRunnersUpStorage,
        }
    ),
    Voting: createStorage(
        'PhragmenElection.Voting',
        {
            v9010: v9010.PhragmenElectionVotingStorage,
        }
    ),
}

export default {events, calls, constants}
