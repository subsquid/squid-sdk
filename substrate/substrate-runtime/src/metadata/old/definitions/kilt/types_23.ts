import {OldTypes} from '../../types'
import {types21} from './types_21'


export const types23: OldTypes['types'] = {
    ...types21,
    MinCollators: 'u32',
    MaxTopCandidates: 'u32',

    // Renamed collator to candidate since they are not always collators (most of them are candidates)
    Candidate: {
        id: 'AccountId',
        stake: 'Balance',
        delegators: 'Vec<Stake>',
        total: 'Balance',
        // renamed from state to status to be consistent
        status: 'CandidateStatus'
    },
    CandidateStatus: {
        _enum: {
            Active: 'Null',
            Leaving: 'SessionIndex'
        }
    },
    StakingStorageVersion: {
        _enum: ['V1_0_0', 'V2_0_0', 'V3_0_0', 'V4', 'V5']
    }
}
