import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Approved: createEvent(
        'Council.Approved',
        {
            v1020: CouncilApprovedEvent,
            v9130: CouncilApprovedEvent,
        }
    ),
    Closed: createEvent(
        'Council.Closed',
        {
            v1050: CouncilClosedEvent,
            v9130: CouncilClosedEvent,
        }
    ),
    Disapproved: createEvent(
        'Council.Disapproved',
        {
            v1020: CouncilDisapprovedEvent,
            v9130: CouncilDisapprovedEvent,
        }
    ),
    Executed: createEvent(
        'Council.Executed',
        {
            v1020: CouncilExecutedEvent,
            v2005: CouncilExecutedEvent,
            v9111: CouncilExecutedEvent,
            v9130: CouncilExecutedEvent,
            v9160: CouncilExecutedEvent,
            v9170: CouncilExecutedEvent,
            v9190: CouncilExecutedEvent,
            v9320: CouncilExecutedEvent,
        }
    ),
    MemberExecuted: createEvent(
        'Council.MemberExecuted',
        {
            v1020: CouncilMemberExecutedEvent,
            v2005: CouncilMemberExecutedEvent,
            v9111: CouncilMemberExecutedEvent,
            v9130: CouncilMemberExecutedEvent,
            v9160: CouncilMemberExecutedEvent,
            v9170: CouncilMemberExecutedEvent,
            v9190: CouncilMemberExecutedEvent,
            v9320: CouncilMemberExecutedEvent,
        }
    ),
    Proposed: createEvent(
        'Council.Proposed',
        {
            v1020: CouncilProposedEvent,
            v9130: CouncilProposedEvent,
        }
    ),
    Voted: createEvent(
        'Council.Voted',
        {
            v1020: CouncilVotedEvent,
            v9130: CouncilVotedEvent,
        }
    ),
}

export const calls = {
    close: createCall(
        'Council.close',
        {
            v1050: CouncilCloseCall,
            v2005: CouncilCloseCall,
            v9111: CouncilCloseCall,
            v9320: CouncilCloseCall,
        }
    ),
    close_old_weight: createCall(
        'Council.close_old_weight',
        {
            v9320: CouncilCloseOldWeightCall,
        }
    ),
    disapprove_proposal: createCall(
        'Council.disapprove_proposal',
        {
            v2005: CouncilDisapproveProposalCall,
            v9111: CouncilDisapproveProposalCall,
        }
    ),
    execute: createCall(
        'Council.execute',
        {
            v1020: CouncilExecuteCall,
            v1022: CouncilExecuteCall,
            v1024: CouncilExecuteCall,
            v1027: CouncilExecuteCall,
            v1029: CouncilExecuteCall,
            v1030: CouncilExecuteCall,
            v1031: CouncilExecuteCall,
            v1032: CouncilExecuteCall,
            v1038: CouncilExecuteCall,
            v1040: CouncilExecuteCall,
            v1042: CouncilExecuteCall,
            v1050: CouncilExecuteCall,
            v1054: CouncilExecuteCall,
            v1055: CouncilExecuteCall,
            v1058: CouncilExecuteCall,
            v1062: CouncilExecuteCall,
            v2005: CouncilExecuteCall,
            v2007: CouncilExecuteCall,
            v2011: CouncilExecuteCall,
            v2013: CouncilExecuteCall,
            v2015: CouncilExecuteCall,
            v2022: CouncilExecuteCall,
            v2023: CouncilExecuteCall,
            v2024: CouncilExecuteCall,
            v2025: CouncilExecuteCall,
            v2026: CouncilExecuteCall,
            v2028: CouncilExecuteCall,
            v2029: CouncilExecuteCall,
            v2030: CouncilExecuteCall,
            v9010: CouncilExecuteCall,
            v9030: CouncilExecuteCall,
            v9040: CouncilExecuteCall,
            v9050: CouncilExecuteCall,
            v9080: CouncilExecuteCall,
            v9090: CouncilExecuteCall,
            v9100: CouncilExecuteCall,
            v9111: CouncilExecuteCall,
            v9122: CouncilExecuteCall,
            v9130: CouncilExecuteCall,
            v9160: CouncilExecuteCall,
            v9170: CouncilExecuteCall,
            v9180: CouncilExecuteCall,
            v9190: CouncilExecuteCall,
            v9220: CouncilExecuteCall,
            v9230: CouncilExecuteCall,
            v9250: CouncilExecuteCall,
            v9271: CouncilExecuteCall,
            v9291: CouncilExecuteCall,
            v9300: CouncilExecuteCall,
            v9320: CouncilExecuteCall,
            v9340: CouncilExecuteCall,
            v9350: CouncilExecuteCall,
            v9370: CouncilExecuteCall,
            v9381: CouncilExecuteCall,
        }
    ),
    propose: createCall(
        'Council.propose',
        {
            v1020: CouncilProposeCall,
            v1022: CouncilProposeCall,
            v1024: CouncilProposeCall,
            v1027: CouncilProposeCall,
            v1029: CouncilProposeCall,
            v1030: CouncilProposeCall,
            v1031: CouncilProposeCall,
            v1032: CouncilProposeCall,
            v1038: CouncilProposeCall,
            v1040: CouncilProposeCall,
            v1042: CouncilProposeCall,
            v1050: CouncilProposeCall,
            v1054: CouncilProposeCall,
            v1055: CouncilProposeCall,
            v1058: CouncilProposeCall,
            v1062: CouncilProposeCall,
            v2005: CouncilProposeCall,
            v2007: CouncilProposeCall,
            v2011: CouncilProposeCall,
            v2013: CouncilProposeCall,
            v2015: CouncilProposeCall,
            v2022: CouncilProposeCall,
            v2023: CouncilProposeCall,
            v2024: CouncilProposeCall,
            v2025: CouncilProposeCall,
            v2026: CouncilProposeCall,
            v2028: CouncilProposeCall,
            v2029: CouncilProposeCall,
            v2030: CouncilProposeCall,
            v9010: CouncilProposeCall,
            v9030: CouncilProposeCall,
            v9040: CouncilProposeCall,
            v9050: CouncilProposeCall,
            v9080: CouncilProposeCall,
            v9090: CouncilProposeCall,
            v9100: CouncilProposeCall,
            v9111: CouncilProposeCall,
            v9122: CouncilProposeCall,
            v9130: CouncilProposeCall,
            v9160: CouncilProposeCall,
            v9170: CouncilProposeCall,
            v9180: CouncilProposeCall,
            v9190: CouncilProposeCall,
            v9220: CouncilProposeCall,
            v9230: CouncilProposeCall,
            v9250: CouncilProposeCall,
            v9271: CouncilProposeCall,
            v9291: CouncilProposeCall,
            v9300: CouncilProposeCall,
            v9320: CouncilProposeCall,
            v9340: CouncilProposeCall,
            v9350: CouncilProposeCall,
            v9370: CouncilProposeCall,
            v9381: CouncilProposeCall,
        }
    ),
    set_members: createCall(
        'Council.set_members',
        {
            v1020: CouncilSetMembersCall,
            v1050: CouncilSetMembersCall,
            v2005: CouncilSetMembersCall,
            v9111: CouncilSetMembersCall,
        }
    ),
    vote: createCall(
        'Council.vote',
        {
            v1020: CouncilVoteCall,
        }
    ),
}

export const storage = {
    Members: createStorage(
        'Council.Members',
        {
            v1020: CouncilMembersStorage,
        }
    ),
    Prime: createStorage(
        'Council.Prime',
        {
            v1050: CouncilPrimeStorage,
        }
    ),
    ProposalCount: createStorage(
        'Council.ProposalCount',
        {
            v1020: CouncilProposalCountStorage,
        }
    ),
    ProposalOf: createStorage(
        'Council.ProposalOf',
        {
            v1020: CouncilProposalOfStorage,
            v1022: CouncilProposalOfStorage,
            v1024: CouncilProposalOfStorage,
            v1027: CouncilProposalOfStorage,
            v1029: CouncilProposalOfStorage,
            v1030: CouncilProposalOfStorage,
            v1031: CouncilProposalOfStorage,
            v1032: CouncilProposalOfStorage,
            v1038: CouncilProposalOfStorage,
            v1040: CouncilProposalOfStorage,
            v1042: CouncilProposalOfStorage,
            v1050: CouncilProposalOfStorage,
            v1054: CouncilProposalOfStorage,
            v1055: CouncilProposalOfStorage,
            v1058: CouncilProposalOfStorage,
            v1062: CouncilProposalOfStorage,
            v2005: CouncilProposalOfStorage,
            v2007: CouncilProposalOfStorage,
            v2011: CouncilProposalOfStorage,
            v2013: CouncilProposalOfStorage,
            v2015: CouncilProposalOfStorage,
            v2022: CouncilProposalOfStorage,
            v2023: CouncilProposalOfStorage,
            v2024: CouncilProposalOfStorage,
            v2025: CouncilProposalOfStorage,
            v2026: CouncilProposalOfStorage,
            v2028: CouncilProposalOfStorage,
            v2029: CouncilProposalOfStorage,
            v2030: CouncilProposalOfStorage,
            v9010: CouncilProposalOfStorage,
            v9030: CouncilProposalOfStorage,
            v9040: CouncilProposalOfStorage,
            v9050: CouncilProposalOfStorage,
            v9080: CouncilProposalOfStorage,
            v9090: CouncilProposalOfStorage,
            v9100: CouncilProposalOfStorage,
            v9111: CouncilProposalOfStorage,
            v9122: CouncilProposalOfStorage,
            v9130: CouncilProposalOfStorage,
            v9160: CouncilProposalOfStorage,
            v9170: CouncilProposalOfStorage,
            v9180: CouncilProposalOfStorage,
            v9190: CouncilProposalOfStorage,
            v9220: CouncilProposalOfStorage,
            v9230: CouncilProposalOfStorage,
            v9250: CouncilProposalOfStorage,
            v9271: CouncilProposalOfStorage,
            v9291: CouncilProposalOfStorage,
            v9300: CouncilProposalOfStorage,
            v9320: CouncilProposalOfStorage,
            v9340: CouncilProposalOfStorage,
            v9350: CouncilProposalOfStorage,
            v9370: CouncilProposalOfStorage,
            v9381: CouncilProposalOfStorage,
        }
    ),
    Proposals: createStorage(
        'Council.Proposals',
        {
            v1020: CouncilProposalsStorage,
        }
    ),
    Voting: createStorage(
        'Council.Voting',
        {
            v1020: CouncilVotingStorage,
            v1050: CouncilVotingStorage,
        }
    ),
}

export default {events, calls}
