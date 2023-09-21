import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v2028 from './types/v2028'
import * as v2027 from './types/v2027'
import * as v2025 from './types/v2025'
import * as v2005 from './types/v2005'
import * as v1062 from './types/v1062'
import * as v1058 from './types/v1058'
import * as v1050 from './types/v1050'
import * as v1020 from './types/v1020'

export const events = {
    CandidateSlashed: createEvent(
        'ElectionsPhragmen.CandidateSlashed',
        {
            v2027: v2027.ElectionsPhragmenCandidateSlashedEvent,
        }
    ),
    ElectionError: createEvent(
        'ElectionsPhragmen.ElectionError',
        {
            v2025: v2025.ElectionsPhragmenElectionErrorEvent,
        }
    ),
    EmptyTerm: createEvent(
        'ElectionsPhragmen.EmptyTerm',
        {
            v1020: v1020.ElectionsPhragmenEmptyTermEvent,
        }
    ),
    MemberKicked: createEvent(
        'ElectionsPhragmen.MemberKicked',
        {
            v1020: v1020.ElectionsPhragmenMemberKickedEvent,
        }
    ),
    MemberRenounced: createEvent(
        'ElectionsPhragmen.MemberRenounced',
        {
            v1020: v1020.ElectionsPhragmenMemberRenouncedEvent,
        }
    ),
    NewTerm: createEvent(
        'ElectionsPhragmen.NewTerm',
        {
            v1020: v1020.ElectionsPhragmenNewTermEvent,
        }
    ),
    Renounced: createEvent(
        'ElectionsPhragmen.Renounced',
        {
            v2028: v2028.ElectionsPhragmenRenouncedEvent,
        }
    ),
    SeatHolderSlashed: createEvent(
        'ElectionsPhragmen.SeatHolderSlashed',
        {
            v2027: v2027.ElectionsPhragmenSeatHolderSlashedEvent,
        }
    ),
    VoterReported: createEvent(
        'ElectionsPhragmen.VoterReported',
        {
            v1020: v1020.ElectionsPhragmenVoterReportedEvent,
        }
    ),
}

export const calls = {
    clean_defunct_voters: createCall(
        'ElectionsPhragmen.clean_defunct_voters',
        {
            v2028: v2028.ElectionsPhragmenCleanDefunctVotersCall,
        }
    ),
    remove_member: createCall(
        'ElectionsPhragmen.remove_member',
        {
            v1020: v1020.ElectionsPhragmenRemoveMemberCall,
            v1050: v1050.ElectionsPhragmenRemoveMemberCall,
            v2005: v2005.ElectionsPhragmenRemoveMemberCall,
            v2028: v2028.ElectionsPhragmenRemoveMemberCall,
        }
    ),
    remove_voter: createCall(
        'ElectionsPhragmen.remove_voter',
        {
            v1020: v1020.ElectionsPhragmenRemoveVoterCall,
        }
    ),
    renounce_candidacy: createCall(
        'ElectionsPhragmen.renounce_candidacy',
        {
            v1020: v1020.ElectionsPhragmenRenounceCandidacyCall,
            v2005: v2005.ElectionsPhragmenRenounceCandidacyCall,
        }
    ),
    report_defunct_voter: createCall(
        'ElectionsPhragmen.report_defunct_voter',
        {
            v1020: v1020.ElectionsPhragmenReportDefunctVoterCall,
            v1050: v1050.ElectionsPhragmenReportDefunctVoterCall,
            v2005: v2005.ElectionsPhragmenReportDefunctVoterCall,
        }
    ),
    submit_candidacy: createCall(
        'ElectionsPhragmen.submit_candidacy',
        {
            v1020: v1020.ElectionsPhragmenSubmitCandidacyCall,
            v2005: v2005.ElectionsPhragmenSubmitCandidacyCall,
        }
    ),
    vote: createCall(
        'ElectionsPhragmen.vote',
        {
            v1020: v1020.ElectionsPhragmenVoteCall,
        }
    ),
}

export const constants = {
    CandidacyBond: createConstant(
        'ElectionsPhragmen.CandidacyBond',
        {
            v1020: v1020.ElectionsPhragmenCandidacyBondConstant,
        }
    ),
    DesiredMembers: createConstant(
        'ElectionsPhragmen.DesiredMembers',
        {
            v1020: v1020.ElectionsPhragmenDesiredMembersConstant,
        }
    ),
    DesiredRunnersUp: createConstant(
        'ElectionsPhragmen.DesiredRunnersUp',
        {
            v1020: v1020.ElectionsPhragmenDesiredRunnersUpConstant,
        }
    ),
    ModuleId: createConstant(
        'ElectionsPhragmen.ModuleId',
        {
            v1062: v1062.ElectionsPhragmenModuleIdConstant,
        }
    ),
    TermDuration: createConstant(
        'ElectionsPhragmen.TermDuration',
        {
            v1020: v1020.ElectionsPhragmenTermDurationConstant,
        }
    ),
    VotingBond: createConstant(
        'ElectionsPhragmen.VotingBond',
        {
            v1020: v1020.ElectionsPhragmenVotingBondConstant,
        }
    ),
    VotingBondBase: createConstant(
        'ElectionsPhragmen.VotingBondBase',
        {
            v2028: v2028.ElectionsPhragmenVotingBondBaseConstant,
        }
    ),
    VotingBondFactor: createConstant(
        'ElectionsPhragmen.VotingBondFactor',
        {
            v2028: v2028.ElectionsPhragmenVotingBondFactorConstant,
        }
    ),
}

export const storage = {
    Candidates: createStorage(
        'ElectionsPhragmen.Candidates',
        {
            v1020: v1020.ElectionsPhragmenCandidatesStorage,
            v2028: v2028.ElectionsPhragmenCandidatesStorage,
        }
    ),
    ElectionRounds: createStorage(
        'ElectionsPhragmen.ElectionRounds',
        {
            v1020: v1020.ElectionsPhragmenElectionRoundsStorage,
        }
    ),
    Members: createStorage(
        'ElectionsPhragmen.Members',
        {
            v1020: v1020.ElectionsPhragmenMembersStorage,
            v2028: v2028.ElectionsPhragmenMembersStorage,
        }
    ),
    RunnersUp: createStorage(
        'ElectionsPhragmen.RunnersUp',
        {
            v1020: v1020.ElectionsPhragmenRunnersUpStorage,
            v2028: v2028.ElectionsPhragmenRunnersUpStorage,
        }
    ),
    StakeOf: createStorage(
        'ElectionsPhragmen.StakeOf',
        {
            v1020: v1020.ElectionsPhragmenStakeOfStorage,
        }
    ),
    VotesOf: createStorage(
        'ElectionsPhragmen.VotesOf',
        {
            v1020: v1020.ElectionsPhragmenVotesOfStorage,
        }
    ),
    Voting: createStorage(
        'ElectionsPhragmen.Voting',
        {
            v1058: v1058.ElectionsPhragmenVotingStorage,
            v2028: v2028.ElectionsPhragmenVotingStorage,
        }
    ),
}

export default {events, calls, constants}
