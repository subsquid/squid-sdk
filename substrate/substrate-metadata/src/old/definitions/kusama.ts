import {OldTypeExp, OldTypesBundle} from "../types"

const sharedTypes = {
    CompactAssignments: 'CompactAssignmentsWith24',
    RawSolution: 'RawSolutionWith24',
    Keys: 'SessionKeys6',
    ProxyType: {
        _enum: ['Any', 'NonTransfer', 'Governance', 'Staking', 'IdentityJudgement', 'CancelProxy', 'Auction']
    }
}


const addrIndicesTypes = {
    AccountInfo: 'AccountInfoWithRefCount',
    Address: 'LookupSource',
    CompactAssignments: 'CompactAssignmentsWith16',
    RawSolution: 'RawSolutionWith16',
    Keys: 'SessionKeys5',
    LookupSource: 'IndicesLookupSource',
    ValidatorPrefs: 'ValidatorPrefsWithCommission'
}


const addrAccountIdTypes = {
    AccountInfo: 'AccountInfoWithRefCount',
    Address: 'AccountId',
    CompactAssignments: 'CompactAssignmentsWith16',
    RawSolution: 'RawSolutionWith16',
    Keys: 'SessionKeys5',
    LookupSource: 'AccountId',
    ValidatorPrefs: 'ValidatorPrefsWithCommission'
}


function mapXcmTypes(version: string): Record<string, OldTypeExp> {
    let types: Record<string, OldTypeExp> = {}
    ;[
        'AssetInstance',
        'Fungibility',
        'Junction',
        'Junctions',
        'MultiAsset',
        'MultiAssetFilter',
        'MultiLocation',
        'Response',
        'WildFungibility',
        'WildMultiAsset',
        'Xcm',
        'XcmError',
        'XcmOrder'
    ].forEach(name => {
        types[name] = name + version
    })
    return types
}


export const bundle: OldTypesBundle = {
    types: {},
    versions: [
        {
            // 1020 is first CC3
            minmax: [1019, 1031],
            types: {
                ...addrIndicesTypes,
                BalanceLock: 'BalanceLockTo212',
                CompactAssignments: 'CompactAssignmentsTo257',
                DispatchError: 'DispatchErrorTo198',
                DispatchInfo: 'DispatchInfoTo244',
                Heartbeat: 'HeartbeatTo244',
                IdentityInfo: 'IdentityInfoTo198',
                Keys: 'SessionKeys5',
                Multiplier: 'Fixed64',
                OpenTip: 'OpenTipTo225',
                RefCount: 'RefCountTo259',
                ReferendumInfo: 'ReferendumInfoTo239',
                SlashingSpans: 'SlashingSpansTo204',
                StakingLedger: 'StakingLedgerTo223',
                Votes: 'VotesTo230',
                Weight: 'u32'
            }
        },
        {
            minmax: [1032, 1042],
            types: {
                ...addrIndicesTypes,
                BalanceLock: 'BalanceLockTo212',
                CompactAssignments: 'CompactAssignmentsTo257',
                DispatchInfo: 'DispatchInfoTo244',
                Heartbeat: 'HeartbeatTo244',
                Keys: 'SessionKeys5',
                Multiplier: 'Fixed64',
                OpenTip: 'OpenTipTo225',
                RefCount: 'RefCountTo259',
                ReferendumInfo: 'ReferendumInfoTo239',
                SlashingSpans: 'SlashingSpansTo204',
                StakingLedger: 'StakingLedgerTo223',
                Votes: 'VotesTo230',
                Weight: 'u32'
            }
        },
        {
            // actual at 1045 (1043-1044 is dev)
            minmax: [1043, 1045],
            types: {
                ...addrIndicesTypes,
                BalanceLock: 'BalanceLockTo212',
                CompactAssignments: 'CompactAssignmentsTo257',
                DispatchInfo: 'DispatchInfoTo244',
                Heartbeat: 'HeartbeatTo244',
                Keys: 'SessionKeys5',
                Multiplier: 'Fixed64',
                OpenTip: 'OpenTipTo225',
                RefCount: 'RefCountTo259',
                ReferendumInfo: 'ReferendumInfoTo239',
                StakingLedger: 'StakingLedgerTo223',
                Votes: 'VotesTo230',
                Weight: 'u32'
            }
        },
        {
            minmax: [1046, 1054],
            types: {
                // Indices optional, not in transaction
                ...sharedTypes,
                ...addrAccountIdTypes,
                CompactAssignments: 'CompactAssignmentsTo257',
                DispatchInfo: 'DispatchInfoTo244',
                Heartbeat: 'HeartbeatTo244',
                Multiplier: 'Fixed64',
                OpenTip: 'OpenTipTo225',
                RefCount: 'RefCountTo259',
                ReferendumInfo: 'ReferendumInfoTo239',
                StakingLedger: 'StakingLedgerTo240',
                Weight: 'u32'
            }
        },
        {
            minmax: [1055, 1056],
            types: {
                ...sharedTypes,
                ...addrAccountIdTypes,
                CompactAssignments: 'CompactAssignmentsTo257',
                DispatchInfo: 'DispatchInfoTo244',
                Heartbeat: 'HeartbeatTo244',
                Multiplier: 'Fixed64',
                OpenTip: 'OpenTipTo225',
                RefCount: 'RefCountTo259',
                StakingLedger: 'StakingLedgerTo240',
                Weight: 'u32'
            }
        },
        {
            minmax: [1057, 1061],
            types: {
                ...sharedTypes,
                ...addrAccountIdTypes,
                CompactAssignments: 'CompactAssignmentsTo257',
                DispatchInfo: 'DispatchInfoTo244',
                Heartbeat: 'HeartbeatTo244',
                OpenTip: 'OpenTipTo225',
                RefCount: 'RefCountTo259'
            }
        },
        {
            minmax: [1062, 2012],
            types: {
                ...sharedTypes,
                ...addrAccountIdTypes,
                CompactAssignments: 'CompactAssignmentsTo257',
                OpenTip: 'OpenTipTo225',
                RefCount: 'RefCountTo259'
            }
        },
        {
            minmax: [2013, 2022],
            types: {
                ...sharedTypes,
                ...addrAccountIdTypes,
                CompactAssignments: 'CompactAssignmentsTo257',
                RefCount: 'RefCountTo259'
            }
        },
        {
            minmax: [2023, 2024],
            types: {
                ...sharedTypes,
                ...addrAccountIdTypes,
                RefCount: 'RefCountTo259'
            }
        },
        {
            minmax: [2025, 2027],
            types: {
                ...sharedTypes,
                ...addrAccountIdTypes
            }
        },
        {
            minmax: [2028, 2029],
            types: {
                ...sharedTypes,
                AccountInfo: 'AccountInfoWithDualRefCount',
                CompactAssignments: 'CompactAssignmentsWith16',
                RawSolution: 'RawSolutionWith16'
            }
        },
        {
            minmax: [2030, 9000],
            types: {
                ...sharedTypes,
                CompactAssignments: 'CompactAssignmentsWith16',
                RawSolution: 'RawSolutionWith16'
            }
        },
        {
            minmax: [9010, 9099],
            types: {
                ...sharedTypes,
                ...mapXcmTypes('V0')
            }
        },
        {
            // jump from 9100 to 9110, however align with Rococo
            minmax: [9100, 9105],
            types: {
                ...sharedTypes,
                ...mapXcmTypes('V1')
            }
        },
        {
            // metadata v14
            minmax: [9106, null],
            types: {}
        }
    ],
    signedExtensions: {
        LimitParathreadCommits: 'Null',
        OnlyStakingAndClaims: 'Null',
        PrevalidateAttests: 'Null',
        RestrictFunctionality: 'Null',
        TransactionCallFilter: 'Null',
        ValidateDoubleVoteReports: 'Null'
    }
}
