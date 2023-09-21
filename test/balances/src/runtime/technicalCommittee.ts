import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9381 from './types/v9381'
import * as v9370 from './types/v9370'
import * as v9350 from './types/v9350'
import * as v9340 from './types/v9340'
import * as v9320 from './types/v9320'
import * as v9300 from './types/v9300'
import * as v9291 from './types/v9291'
import * as v9271 from './types/v9271'
import * as v9250 from './types/v9250'
import * as v9230 from './types/v9230'
import * as v9220 from './types/v9220'
import * as v9190 from './types/v9190'
import * as v9180 from './types/v9180'
import * as v9170 from './types/v9170'
import * as v9160 from './types/v9160'
import * as v9130 from './types/v9130'
import * as v9122 from './types/v9122'
import * as v9111 from './types/v9111'
import * as v9100 from './types/v9100'
import * as v9090 from './types/v9090'
import * as v9080 from './types/v9080'
import * as v9050 from './types/v9050'
import * as v9040 from './types/v9040'
import * as v9030 from './types/v9030'
import * as v9010 from './types/v9010'
import * as v2030 from './types/v2030'
import * as v2029 from './types/v2029'
import * as v2028 from './types/v2028'
import * as v2026 from './types/v2026'
import * as v2025 from './types/v2025'
import * as v2024 from './types/v2024'
import * as v2023 from './types/v2023'
import * as v2022 from './types/v2022'
import * as v2015 from './types/v2015'
import * as v2013 from './types/v2013'
import * as v2011 from './types/v2011'
import * as v2007 from './types/v2007'
import * as v2005 from './types/v2005'
import * as v1062 from './types/v1062'
import * as v1058 from './types/v1058'
import * as v1055 from './types/v1055'
import * as v1054 from './types/v1054'
import * as v1050 from './types/v1050'
import * as v1042 from './types/v1042'
import * as v1040 from './types/v1040'
import * as v1038 from './types/v1038'
import * as v1032 from './types/v1032'
import * as v1031 from './types/v1031'
import * as v1030 from './types/v1030'
import * as v1029 from './types/v1029'
import * as v1027 from './types/v1027'
import * as v1024 from './types/v1024'
import * as v1022 from './types/v1022'
import * as v1020 from './types/v1020'

export const events = {
    Approved: createEvent(
        'TechnicalCommittee.Approved',
        {
            v1020: v1020.TechnicalCommitteeApprovedEvent,
            v9130: v9130.TechnicalCommitteeApprovedEvent,
        }
    ),
    Closed: createEvent(
        'TechnicalCommittee.Closed',
        {
            v1050: v1050.TechnicalCommitteeClosedEvent,
            v9130: v9130.TechnicalCommitteeClosedEvent,
        }
    ),
    Disapproved: createEvent(
        'TechnicalCommittee.Disapproved',
        {
            v1020: v1020.TechnicalCommitteeDisapprovedEvent,
            v9130: v9130.TechnicalCommitteeDisapprovedEvent,
        }
    ),
    Executed: createEvent(
        'TechnicalCommittee.Executed',
        {
            v1020: v1020.TechnicalCommitteeExecutedEvent,
            v2005: v2005.TechnicalCommitteeExecutedEvent,
            v9111: v9111.TechnicalCommitteeExecutedEvent,
            v9130: v9130.TechnicalCommitteeExecutedEvent,
            v9160: v9160.TechnicalCommitteeExecutedEvent,
            v9170: v9170.TechnicalCommitteeExecutedEvent,
            v9190: v9190.TechnicalCommitteeExecutedEvent,
            v9320: v9320.TechnicalCommitteeExecutedEvent,
        }
    ),
    MemberExecuted: createEvent(
        'TechnicalCommittee.MemberExecuted',
        {
            v1020: v1020.TechnicalCommitteeMemberExecutedEvent,
            v2005: v2005.TechnicalCommitteeMemberExecutedEvent,
            v9111: v9111.TechnicalCommitteeMemberExecutedEvent,
            v9130: v9130.TechnicalCommitteeMemberExecutedEvent,
            v9160: v9160.TechnicalCommitteeMemberExecutedEvent,
            v9170: v9170.TechnicalCommitteeMemberExecutedEvent,
            v9190: v9190.TechnicalCommitteeMemberExecutedEvent,
            v9320: v9320.TechnicalCommitteeMemberExecutedEvent,
        }
    ),
    Proposed: createEvent(
        'TechnicalCommittee.Proposed',
        {
            v1020: v1020.TechnicalCommitteeProposedEvent,
            v9130: v9130.TechnicalCommitteeProposedEvent,
        }
    ),
    Voted: createEvent(
        'TechnicalCommittee.Voted',
        {
            v1020: v1020.TechnicalCommitteeVotedEvent,
            v9130: v9130.TechnicalCommitteeVotedEvent,
        }
    ),
}

export const calls = {
    close: createCall(
        'TechnicalCommittee.close',
        {
            v1050: v1050.TechnicalCommitteeCloseCall,
            v2005: v2005.TechnicalCommitteeCloseCall,
            v9111: v9111.TechnicalCommitteeCloseCall,
            v9320: v9320.TechnicalCommitteeCloseCall,
        }
    ),
    close_old_weight: createCall(
        'TechnicalCommittee.close_old_weight',
        {
            v9320: v9320.TechnicalCommitteeCloseOldWeightCall,
        }
    ),
    disapprove_proposal: createCall(
        'TechnicalCommittee.disapprove_proposal',
        {
            v2005: v2005.TechnicalCommitteeDisapproveProposalCall,
            v9111: v9111.TechnicalCommitteeDisapproveProposalCall,
        }
    ),
    execute: createCall(
        'TechnicalCommittee.execute',
        {
            v1020: v1020.TechnicalCommitteeExecuteCall,
            v1022: v1022.TechnicalCommitteeExecuteCall,
            v1024: v1024.TechnicalCommitteeExecuteCall,
            v1027: v1027.TechnicalCommitteeExecuteCall,
            v1029: v1029.TechnicalCommitteeExecuteCall,
            v1030: v1030.TechnicalCommitteeExecuteCall,
            v1031: v1031.TechnicalCommitteeExecuteCall,
            v1032: v1032.TechnicalCommitteeExecuteCall,
            v1038: v1038.TechnicalCommitteeExecuteCall,
            v1040: v1040.TechnicalCommitteeExecuteCall,
            v1042: v1042.TechnicalCommitteeExecuteCall,
            v1050: v1050.TechnicalCommitteeExecuteCall,
            v1054: v1054.TechnicalCommitteeExecuteCall,
            v1055: v1055.TechnicalCommitteeExecuteCall,
            v1058: v1058.TechnicalCommitteeExecuteCall,
            v1062: v1062.TechnicalCommitteeExecuteCall,
            v2005: v2005.TechnicalCommitteeExecuteCall,
            v2007: v2007.TechnicalCommitteeExecuteCall,
            v2011: v2011.TechnicalCommitteeExecuteCall,
            v2013: v2013.TechnicalCommitteeExecuteCall,
            v2015: v2015.TechnicalCommitteeExecuteCall,
            v2022: v2022.TechnicalCommitteeExecuteCall,
            v2023: v2023.TechnicalCommitteeExecuteCall,
            v2024: v2024.TechnicalCommitteeExecuteCall,
            v2025: v2025.TechnicalCommitteeExecuteCall,
            v2026: v2026.TechnicalCommitteeExecuteCall,
            v2028: v2028.TechnicalCommitteeExecuteCall,
            v2029: v2029.TechnicalCommitteeExecuteCall,
            v2030: v2030.TechnicalCommitteeExecuteCall,
            v9010: v9010.TechnicalCommitteeExecuteCall,
            v9030: v9030.TechnicalCommitteeExecuteCall,
            v9040: v9040.TechnicalCommitteeExecuteCall,
            v9050: v9050.TechnicalCommitteeExecuteCall,
            v9080: v9080.TechnicalCommitteeExecuteCall,
            v9090: v9090.TechnicalCommitteeExecuteCall,
            v9100: v9100.TechnicalCommitteeExecuteCall,
            v9111: v9111.TechnicalCommitteeExecuteCall,
            v9122: v9122.TechnicalCommitteeExecuteCall,
            v9130: v9130.TechnicalCommitteeExecuteCall,
            v9160: v9160.TechnicalCommitteeExecuteCall,
            v9170: v9170.TechnicalCommitteeExecuteCall,
            v9180: v9180.TechnicalCommitteeExecuteCall,
            v9190: v9190.TechnicalCommitteeExecuteCall,
            v9220: v9220.TechnicalCommitteeExecuteCall,
            v9230: v9230.TechnicalCommitteeExecuteCall,
            v9250: v9250.TechnicalCommitteeExecuteCall,
            v9271: v9271.TechnicalCommitteeExecuteCall,
            v9291: v9291.TechnicalCommitteeExecuteCall,
            v9300: v9300.TechnicalCommitteeExecuteCall,
            v9320: v9320.TechnicalCommitteeExecuteCall,
            v9340: v9340.TechnicalCommitteeExecuteCall,
            v9350: v9350.TechnicalCommitteeExecuteCall,
            v9370: v9370.TechnicalCommitteeExecuteCall,
            v9381: v9381.TechnicalCommitteeExecuteCall,
        }
    ),
    propose: createCall(
        'TechnicalCommittee.propose',
        {
            v1020: v1020.TechnicalCommitteeProposeCall,
            v1022: v1022.TechnicalCommitteeProposeCall,
            v1024: v1024.TechnicalCommitteeProposeCall,
            v1027: v1027.TechnicalCommitteeProposeCall,
            v1029: v1029.TechnicalCommitteeProposeCall,
            v1030: v1030.TechnicalCommitteeProposeCall,
            v1031: v1031.TechnicalCommitteeProposeCall,
            v1032: v1032.TechnicalCommitteeProposeCall,
            v1038: v1038.TechnicalCommitteeProposeCall,
            v1040: v1040.TechnicalCommitteeProposeCall,
            v1042: v1042.TechnicalCommitteeProposeCall,
            v1050: v1050.TechnicalCommitteeProposeCall,
            v1054: v1054.TechnicalCommitteeProposeCall,
            v1055: v1055.TechnicalCommitteeProposeCall,
            v1058: v1058.TechnicalCommitteeProposeCall,
            v1062: v1062.TechnicalCommitteeProposeCall,
            v2005: v2005.TechnicalCommitteeProposeCall,
            v2007: v2007.TechnicalCommitteeProposeCall,
            v2011: v2011.TechnicalCommitteeProposeCall,
            v2013: v2013.TechnicalCommitteeProposeCall,
            v2015: v2015.TechnicalCommitteeProposeCall,
            v2022: v2022.TechnicalCommitteeProposeCall,
            v2023: v2023.TechnicalCommitteeProposeCall,
            v2024: v2024.TechnicalCommitteeProposeCall,
            v2025: v2025.TechnicalCommitteeProposeCall,
            v2026: v2026.TechnicalCommitteeProposeCall,
            v2028: v2028.TechnicalCommitteeProposeCall,
            v2029: v2029.TechnicalCommitteeProposeCall,
            v2030: v2030.TechnicalCommitteeProposeCall,
            v9010: v9010.TechnicalCommitteeProposeCall,
            v9030: v9030.TechnicalCommitteeProposeCall,
            v9040: v9040.TechnicalCommitteeProposeCall,
            v9050: v9050.TechnicalCommitteeProposeCall,
            v9080: v9080.TechnicalCommitteeProposeCall,
            v9090: v9090.TechnicalCommitteeProposeCall,
            v9100: v9100.TechnicalCommitteeProposeCall,
            v9111: v9111.TechnicalCommitteeProposeCall,
            v9122: v9122.TechnicalCommitteeProposeCall,
            v9130: v9130.TechnicalCommitteeProposeCall,
            v9160: v9160.TechnicalCommitteeProposeCall,
            v9170: v9170.TechnicalCommitteeProposeCall,
            v9180: v9180.TechnicalCommitteeProposeCall,
            v9190: v9190.TechnicalCommitteeProposeCall,
            v9220: v9220.TechnicalCommitteeProposeCall,
            v9230: v9230.TechnicalCommitteeProposeCall,
            v9250: v9250.TechnicalCommitteeProposeCall,
            v9271: v9271.TechnicalCommitteeProposeCall,
            v9291: v9291.TechnicalCommitteeProposeCall,
            v9300: v9300.TechnicalCommitteeProposeCall,
            v9320: v9320.TechnicalCommitteeProposeCall,
            v9340: v9340.TechnicalCommitteeProposeCall,
            v9350: v9350.TechnicalCommitteeProposeCall,
            v9370: v9370.TechnicalCommitteeProposeCall,
            v9381: v9381.TechnicalCommitteeProposeCall,
        }
    ),
    set_members: createCall(
        'TechnicalCommittee.set_members',
        {
            v1020: v1020.TechnicalCommitteeSetMembersCall,
            v1050: v1050.TechnicalCommitteeSetMembersCall,
            v2005: v2005.TechnicalCommitteeSetMembersCall,
            v9111: v9111.TechnicalCommitteeSetMembersCall,
        }
    ),
    vote: createCall(
        'TechnicalCommittee.vote',
        {
            v1020: v1020.TechnicalCommitteeVoteCall,
        }
    ),
}

export const storage = {
    Members: createStorage(
        'TechnicalCommittee.Members',
        {
            v1020: v1020.TechnicalCommitteeMembersStorage,
        }
    ),
    Prime: createStorage(
        'TechnicalCommittee.Prime',
        {
            v1050: v1050.TechnicalCommitteePrimeStorage,
        }
    ),
    ProposalCount: createStorage(
        'TechnicalCommittee.ProposalCount',
        {
            v1020: v1020.TechnicalCommitteeProposalCountStorage,
        }
    ),
    ProposalOf: createStorage(
        'TechnicalCommittee.ProposalOf',
        {
            v1020: v1020.TechnicalCommitteeProposalOfStorage,
            v1022: v1022.TechnicalCommitteeProposalOfStorage,
            v1024: v1024.TechnicalCommitteeProposalOfStorage,
            v1027: v1027.TechnicalCommitteeProposalOfStorage,
            v1029: v1029.TechnicalCommitteeProposalOfStorage,
            v1030: v1030.TechnicalCommitteeProposalOfStorage,
            v1031: v1031.TechnicalCommitteeProposalOfStorage,
            v1032: v1032.TechnicalCommitteeProposalOfStorage,
            v1038: v1038.TechnicalCommitteeProposalOfStorage,
            v1040: v1040.TechnicalCommitteeProposalOfStorage,
            v1042: v1042.TechnicalCommitteeProposalOfStorage,
            v1050: v1050.TechnicalCommitteeProposalOfStorage,
            v1054: v1054.TechnicalCommitteeProposalOfStorage,
            v1055: v1055.TechnicalCommitteeProposalOfStorage,
            v1058: v1058.TechnicalCommitteeProposalOfStorage,
            v1062: v1062.TechnicalCommitteeProposalOfStorage,
            v2005: v2005.TechnicalCommitteeProposalOfStorage,
            v2007: v2007.TechnicalCommitteeProposalOfStorage,
            v2011: v2011.TechnicalCommitteeProposalOfStorage,
            v2013: v2013.TechnicalCommitteeProposalOfStorage,
            v2015: v2015.TechnicalCommitteeProposalOfStorage,
            v2022: v2022.TechnicalCommitteeProposalOfStorage,
            v2023: v2023.TechnicalCommitteeProposalOfStorage,
            v2024: v2024.TechnicalCommitteeProposalOfStorage,
            v2025: v2025.TechnicalCommitteeProposalOfStorage,
            v2026: v2026.TechnicalCommitteeProposalOfStorage,
            v2028: v2028.TechnicalCommitteeProposalOfStorage,
            v2029: v2029.TechnicalCommitteeProposalOfStorage,
            v2030: v2030.TechnicalCommitteeProposalOfStorage,
            v9010: v9010.TechnicalCommitteeProposalOfStorage,
            v9030: v9030.TechnicalCommitteeProposalOfStorage,
            v9040: v9040.TechnicalCommitteeProposalOfStorage,
            v9050: v9050.TechnicalCommitteeProposalOfStorage,
            v9080: v9080.TechnicalCommitteeProposalOfStorage,
            v9090: v9090.TechnicalCommitteeProposalOfStorage,
            v9100: v9100.TechnicalCommitteeProposalOfStorage,
            v9111: v9111.TechnicalCommitteeProposalOfStorage,
            v9122: v9122.TechnicalCommitteeProposalOfStorage,
            v9130: v9130.TechnicalCommitteeProposalOfStorage,
            v9160: v9160.TechnicalCommitteeProposalOfStorage,
            v9170: v9170.TechnicalCommitteeProposalOfStorage,
            v9180: v9180.TechnicalCommitteeProposalOfStorage,
            v9190: v9190.TechnicalCommitteeProposalOfStorage,
            v9220: v9220.TechnicalCommitteeProposalOfStorage,
            v9230: v9230.TechnicalCommitteeProposalOfStorage,
            v9250: v9250.TechnicalCommitteeProposalOfStorage,
            v9271: v9271.TechnicalCommitteeProposalOfStorage,
            v9291: v9291.TechnicalCommitteeProposalOfStorage,
            v9300: v9300.TechnicalCommitteeProposalOfStorage,
            v9320: v9320.TechnicalCommitteeProposalOfStorage,
            v9340: v9340.TechnicalCommitteeProposalOfStorage,
            v9350: v9350.TechnicalCommitteeProposalOfStorage,
            v9370: v9370.TechnicalCommitteeProposalOfStorage,
            v9381: v9381.TechnicalCommitteeProposalOfStorage,
        }
    ),
    Proposals: createStorage(
        'TechnicalCommittee.Proposals',
        {
            v1020: v1020.TechnicalCommitteeProposalsStorage,
        }
    ),
    Voting: createStorage(
        'TechnicalCommittee.Voting',
        {
            v1020: v1020.TechnicalCommitteeVotingStorage,
            v1050: v1050.TechnicalCommitteeVotingStorage,
        }
    ),
}

export default {events, calls}
