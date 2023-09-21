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
        'Council.Approved',
        {
            v1020: v1020.CouncilApprovedEvent,
            v9130: v9130.CouncilApprovedEvent,
        }
    ),
    Closed: createEvent(
        'Council.Closed',
        {
            v1050: v1050.CouncilClosedEvent,
            v9130: v9130.CouncilClosedEvent,
        }
    ),
    Disapproved: createEvent(
        'Council.Disapproved',
        {
            v1020: v1020.CouncilDisapprovedEvent,
            v9130: v9130.CouncilDisapprovedEvent,
        }
    ),
    Executed: createEvent(
        'Council.Executed',
        {
            v1020: v1020.CouncilExecutedEvent,
            v2005: v2005.CouncilExecutedEvent,
            v9111: v9111.CouncilExecutedEvent,
            v9130: v9130.CouncilExecutedEvent,
            v9160: v9160.CouncilExecutedEvent,
            v9170: v9170.CouncilExecutedEvent,
            v9190: v9190.CouncilExecutedEvent,
            v9320: v9320.CouncilExecutedEvent,
        }
    ),
    MemberExecuted: createEvent(
        'Council.MemberExecuted',
        {
            v1020: v1020.CouncilMemberExecutedEvent,
            v2005: v2005.CouncilMemberExecutedEvent,
            v9111: v9111.CouncilMemberExecutedEvent,
            v9130: v9130.CouncilMemberExecutedEvent,
            v9160: v9160.CouncilMemberExecutedEvent,
            v9170: v9170.CouncilMemberExecutedEvent,
            v9190: v9190.CouncilMemberExecutedEvent,
            v9320: v9320.CouncilMemberExecutedEvent,
        }
    ),
    Proposed: createEvent(
        'Council.Proposed',
        {
            v1020: v1020.CouncilProposedEvent,
            v9130: v9130.CouncilProposedEvent,
        }
    ),
    Voted: createEvent(
        'Council.Voted',
        {
            v1020: v1020.CouncilVotedEvent,
            v9130: v9130.CouncilVotedEvent,
        }
    ),
}

export const calls = {
    close: createCall(
        'Council.close',
        {
            v1050: v1050.CouncilCloseCall,
            v2005: v2005.CouncilCloseCall,
            v9111: v9111.CouncilCloseCall,
            v9320: v9320.CouncilCloseCall,
        }
    ),
    close_old_weight: createCall(
        'Council.close_old_weight',
        {
            v9320: v9320.CouncilCloseOldWeightCall,
        }
    ),
    disapprove_proposal: createCall(
        'Council.disapprove_proposal',
        {
            v2005: v2005.CouncilDisapproveProposalCall,
            v9111: v9111.CouncilDisapproveProposalCall,
        }
    ),
    execute: createCall(
        'Council.execute',
        {
            v1020: v1020.CouncilExecuteCall,
            v1022: v1022.CouncilExecuteCall,
            v1024: v1024.CouncilExecuteCall,
            v1027: v1027.CouncilExecuteCall,
            v1029: v1029.CouncilExecuteCall,
            v1030: v1030.CouncilExecuteCall,
            v1031: v1031.CouncilExecuteCall,
            v1032: v1032.CouncilExecuteCall,
            v1038: v1038.CouncilExecuteCall,
            v1040: v1040.CouncilExecuteCall,
            v1042: v1042.CouncilExecuteCall,
            v1050: v1050.CouncilExecuteCall,
            v1054: v1054.CouncilExecuteCall,
            v1055: v1055.CouncilExecuteCall,
            v1058: v1058.CouncilExecuteCall,
            v1062: v1062.CouncilExecuteCall,
            v2005: v2005.CouncilExecuteCall,
            v2007: v2007.CouncilExecuteCall,
            v2011: v2011.CouncilExecuteCall,
            v2013: v2013.CouncilExecuteCall,
            v2015: v2015.CouncilExecuteCall,
            v2022: v2022.CouncilExecuteCall,
            v2023: v2023.CouncilExecuteCall,
            v2024: v2024.CouncilExecuteCall,
            v2025: v2025.CouncilExecuteCall,
            v2026: v2026.CouncilExecuteCall,
            v2028: v2028.CouncilExecuteCall,
            v2029: v2029.CouncilExecuteCall,
            v2030: v2030.CouncilExecuteCall,
            v9010: v9010.CouncilExecuteCall,
            v9030: v9030.CouncilExecuteCall,
            v9040: v9040.CouncilExecuteCall,
            v9050: v9050.CouncilExecuteCall,
            v9080: v9080.CouncilExecuteCall,
            v9090: v9090.CouncilExecuteCall,
            v9100: v9100.CouncilExecuteCall,
            v9111: v9111.CouncilExecuteCall,
            v9122: v9122.CouncilExecuteCall,
            v9130: v9130.CouncilExecuteCall,
            v9160: v9160.CouncilExecuteCall,
            v9170: v9170.CouncilExecuteCall,
            v9180: v9180.CouncilExecuteCall,
            v9190: v9190.CouncilExecuteCall,
            v9220: v9220.CouncilExecuteCall,
            v9230: v9230.CouncilExecuteCall,
            v9250: v9250.CouncilExecuteCall,
            v9271: v9271.CouncilExecuteCall,
            v9291: v9291.CouncilExecuteCall,
            v9300: v9300.CouncilExecuteCall,
            v9320: v9320.CouncilExecuteCall,
            v9340: v9340.CouncilExecuteCall,
            v9350: v9350.CouncilExecuteCall,
            v9370: v9370.CouncilExecuteCall,
            v9381: v9381.CouncilExecuteCall,
        }
    ),
    propose: createCall(
        'Council.propose',
        {
            v1020: v1020.CouncilProposeCall,
            v1022: v1022.CouncilProposeCall,
            v1024: v1024.CouncilProposeCall,
            v1027: v1027.CouncilProposeCall,
            v1029: v1029.CouncilProposeCall,
            v1030: v1030.CouncilProposeCall,
            v1031: v1031.CouncilProposeCall,
            v1032: v1032.CouncilProposeCall,
            v1038: v1038.CouncilProposeCall,
            v1040: v1040.CouncilProposeCall,
            v1042: v1042.CouncilProposeCall,
            v1050: v1050.CouncilProposeCall,
            v1054: v1054.CouncilProposeCall,
            v1055: v1055.CouncilProposeCall,
            v1058: v1058.CouncilProposeCall,
            v1062: v1062.CouncilProposeCall,
            v2005: v2005.CouncilProposeCall,
            v2007: v2007.CouncilProposeCall,
            v2011: v2011.CouncilProposeCall,
            v2013: v2013.CouncilProposeCall,
            v2015: v2015.CouncilProposeCall,
            v2022: v2022.CouncilProposeCall,
            v2023: v2023.CouncilProposeCall,
            v2024: v2024.CouncilProposeCall,
            v2025: v2025.CouncilProposeCall,
            v2026: v2026.CouncilProposeCall,
            v2028: v2028.CouncilProposeCall,
            v2029: v2029.CouncilProposeCall,
            v2030: v2030.CouncilProposeCall,
            v9010: v9010.CouncilProposeCall,
            v9030: v9030.CouncilProposeCall,
            v9040: v9040.CouncilProposeCall,
            v9050: v9050.CouncilProposeCall,
            v9080: v9080.CouncilProposeCall,
            v9090: v9090.CouncilProposeCall,
            v9100: v9100.CouncilProposeCall,
            v9111: v9111.CouncilProposeCall,
            v9122: v9122.CouncilProposeCall,
            v9130: v9130.CouncilProposeCall,
            v9160: v9160.CouncilProposeCall,
            v9170: v9170.CouncilProposeCall,
            v9180: v9180.CouncilProposeCall,
            v9190: v9190.CouncilProposeCall,
            v9220: v9220.CouncilProposeCall,
            v9230: v9230.CouncilProposeCall,
            v9250: v9250.CouncilProposeCall,
            v9271: v9271.CouncilProposeCall,
            v9291: v9291.CouncilProposeCall,
            v9300: v9300.CouncilProposeCall,
            v9320: v9320.CouncilProposeCall,
            v9340: v9340.CouncilProposeCall,
            v9350: v9350.CouncilProposeCall,
            v9370: v9370.CouncilProposeCall,
            v9381: v9381.CouncilProposeCall,
        }
    ),
    set_members: createCall(
        'Council.set_members',
        {
            v1020: v1020.CouncilSetMembersCall,
            v1050: v1050.CouncilSetMembersCall,
            v2005: v2005.CouncilSetMembersCall,
            v9111: v9111.CouncilSetMembersCall,
        }
    ),
    vote: createCall(
        'Council.vote',
        {
            v1020: v1020.CouncilVoteCall,
        }
    ),
}

export const storage = {
    Members: createStorage(
        'Council.Members',
        {
            v1020: v1020.CouncilMembersStorage,
        }
    ),
    Prime: createStorage(
        'Council.Prime',
        {
            v1050: v1050.CouncilPrimeStorage,
        }
    ),
    ProposalCount: createStorage(
        'Council.ProposalCount',
        {
            v1020: v1020.CouncilProposalCountStorage,
        }
    ),
    ProposalOf: createStorage(
        'Council.ProposalOf',
        {
            v1020: v1020.CouncilProposalOfStorage,
            v1022: v1022.CouncilProposalOfStorage,
            v1024: v1024.CouncilProposalOfStorage,
            v1027: v1027.CouncilProposalOfStorage,
            v1029: v1029.CouncilProposalOfStorage,
            v1030: v1030.CouncilProposalOfStorage,
            v1031: v1031.CouncilProposalOfStorage,
            v1032: v1032.CouncilProposalOfStorage,
            v1038: v1038.CouncilProposalOfStorage,
            v1040: v1040.CouncilProposalOfStorage,
            v1042: v1042.CouncilProposalOfStorage,
            v1050: v1050.CouncilProposalOfStorage,
            v1054: v1054.CouncilProposalOfStorage,
            v1055: v1055.CouncilProposalOfStorage,
            v1058: v1058.CouncilProposalOfStorage,
            v1062: v1062.CouncilProposalOfStorage,
            v2005: v2005.CouncilProposalOfStorage,
            v2007: v2007.CouncilProposalOfStorage,
            v2011: v2011.CouncilProposalOfStorage,
            v2013: v2013.CouncilProposalOfStorage,
            v2015: v2015.CouncilProposalOfStorage,
            v2022: v2022.CouncilProposalOfStorage,
            v2023: v2023.CouncilProposalOfStorage,
            v2024: v2024.CouncilProposalOfStorage,
            v2025: v2025.CouncilProposalOfStorage,
            v2026: v2026.CouncilProposalOfStorage,
            v2028: v2028.CouncilProposalOfStorage,
            v2029: v2029.CouncilProposalOfStorage,
            v2030: v2030.CouncilProposalOfStorage,
            v9010: v9010.CouncilProposalOfStorage,
            v9030: v9030.CouncilProposalOfStorage,
            v9040: v9040.CouncilProposalOfStorage,
            v9050: v9050.CouncilProposalOfStorage,
            v9080: v9080.CouncilProposalOfStorage,
            v9090: v9090.CouncilProposalOfStorage,
            v9100: v9100.CouncilProposalOfStorage,
            v9111: v9111.CouncilProposalOfStorage,
            v9122: v9122.CouncilProposalOfStorage,
            v9130: v9130.CouncilProposalOfStorage,
            v9160: v9160.CouncilProposalOfStorage,
            v9170: v9170.CouncilProposalOfStorage,
            v9180: v9180.CouncilProposalOfStorage,
            v9190: v9190.CouncilProposalOfStorage,
            v9220: v9220.CouncilProposalOfStorage,
            v9230: v9230.CouncilProposalOfStorage,
            v9250: v9250.CouncilProposalOfStorage,
            v9271: v9271.CouncilProposalOfStorage,
            v9291: v9291.CouncilProposalOfStorage,
            v9300: v9300.CouncilProposalOfStorage,
            v9320: v9320.CouncilProposalOfStorage,
            v9340: v9340.CouncilProposalOfStorage,
            v9350: v9350.CouncilProposalOfStorage,
            v9370: v9370.CouncilProposalOfStorage,
            v9381: v9381.CouncilProposalOfStorage,
        }
    ),
    Proposals: createStorage(
        'Council.Proposals',
        {
            v1020: v1020.CouncilProposalsStorage,
        }
    ),
    Voting: createStorage(
        'Council.Voting',
        {
            v1020: v1020.CouncilVotingStorage,
            v1050: v1050.CouncilVotingStorage,
        }
    ),
}

export default {events, calls}
