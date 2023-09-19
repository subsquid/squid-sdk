import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    ElectionFailed: createEvent(
        'ElectionProviderMultiPhase.ElectionFailed',
        {
            v9291: ElectionProviderMultiPhaseElectionFailedEvent,
        }
    ),
    ElectionFinalized: createEvent(
        'ElectionProviderMultiPhase.ElectionFinalized',
        {
            v2029: ElectionProviderMultiPhaseElectionFinalizedEvent,
            v9111: ElectionProviderMultiPhaseElectionFinalizedEvent,
            v9130: ElectionProviderMultiPhaseElectionFinalizedEvent,
            v9291: ElectionProviderMultiPhaseElectionFinalizedEvent,
        }
    ),
    PhaseTransitioned: createEvent(
        'ElectionProviderMultiPhase.PhaseTransitioned',
        {
            v9370: ElectionProviderMultiPhasePhaseTransitionedEvent,
        }
    ),
    Rewarded: createEvent(
        'ElectionProviderMultiPhase.Rewarded',
        {
            v2029: ElectionProviderMultiPhaseRewardedEvent,
            v9090: ElectionProviderMultiPhaseRewardedEvent,
            v9130: ElectionProviderMultiPhaseRewardedEvent,
        }
    ),
    SignedPhaseStarted: createEvent(
        'ElectionProviderMultiPhase.SignedPhaseStarted',
        {
            v2029: ElectionProviderMultiPhaseSignedPhaseStartedEvent,
            v9130: ElectionProviderMultiPhaseSignedPhaseStartedEvent,
        }
    ),
    Slashed: createEvent(
        'ElectionProviderMultiPhase.Slashed',
        {
            v2029: ElectionProviderMultiPhaseSlashedEvent,
            v9090: ElectionProviderMultiPhaseSlashedEvent,
            v9130: ElectionProviderMultiPhaseSlashedEvent,
        }
    ),
    SolutionStored: createEvent(
        'ElectionProviderMultiPhase.SolutionStored',
        {
            v2029: ElectionProviderMultiPhaseSolutionStoredEvent,
            v9080: ElectionProviderMultiPhaseSolutionStoredEvent,
            v9111: ElectionProviderMultiPhaseSolutionStoredEvent,
            v9130: ElectionProviderMultiPhaseSolutionStoredEvent,
            v9291: ElectionProviderMultiPhaseSolutionStoredEvent,
            v9370: ElectionProviderMultiPhaseSolutionStoredEvent,
        }
    ),
    UnsignedPhaseStarted: createEvent(
        'ElectionProviderMultiPhase.UnsignedPhaseStarted',
        {
            v2029: ElectionProviderMultiPhaseUnsignedPhaseStartedEvent,
            v9130: ElectionProviderMultiPhaseUnsignedPhaseStartedEvent,
        }
    ),
}

export const calls = {
    governance_fallback: createCall(
        'ElectionProviderMultiPhase.governance_fallback',
        {
            v9170: ElectionProviderMultiPhaseGovernanceFallbackCall,
        }
    ),
    set_emergency_election_result: createCall(
        'ElectionProviderMultiPhase.set_emergency_election_result',
        {
            v9050: ElectionProviderMultiPhaseSetEmergencyElectionResultCall,
            v9090: ElectionProviderMultiPhaseSetEmergencyElectionResultCall,
        }
    ),
    set_minimum_untrusted_score: createCall(
        'ElectionProviderMultiPhase.set_minimum_untrusted_score',
        {
            v9040: ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall,
            v9111: ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall,
            v9180: ElectionProviderMultiPhaseSetMinimumUntrustedScoreCall,
        }
    ),
    submit: createCall(
        'ElectionProviderMultiPhase.submit',
        {
            v9080: ElectionProviderMultiPhaseSubmitCall,
            v9100: ElectionProviderMultiPhaseSubmitCall,
            v9111: ElectionProviderMultiPhaseSubmitCall,
            v9180: ElectionProviderMultiPhaseSubmitCall,
        }
    ),
    submit_unsigned: createCall(
        'ElectionProviderMultiPhase.submit_unsigned',
        {
            v2029: ElectionProviderMultiPhaseSubmitUnsignedCall,
            v9010: ElectionProviderMultiPhaseSubmitUnsignedCall,
            v9100: ElectionProviderMultiPhaseSubmitUnsignedCall,
            v9111: ElectionProviderMultiPhaseSubmitUnsignedCall,
            v9180: ElectionProviderMultiPhaseSubmitUnsignedCall,
        }
    ),
}

export const constants = {
    BetterSignedThreshold: createConstant(
        'ElectionProviderMultiPhase.BetterSignedThreshold',
        {
            v9220: ElectionProviderMultiPhaseBetterSignedThresholdConstant,
        }
    ),
    BetterUnsignedThreshold: createConstant(
        'ElectionProviderMultiPhase.BetterUnsignedThreshold',
        {
            v9220: ElectionProviderMultiPhaseBetterUnsignedThresholdConstant,
        }
    ),
    MaxElectableTargets: createConstant(
        'ElectionProviderMultiPhase.MaxElectableTargets',
        {
            v9190: ElectionProviderMultiPhaseMaxElectableTargetsConstant,
        }
    ),
    MaxElectingVoters: createConstant(
        'ElectionProviderMultiPhase.MaxElectingVoters',
        {
            v9190: ElectionProviderMultiPhaseMaxElectingVotersConstant,
        }
    ),
    MaxWinners: createConstant(
        'ElectionProviderMultiPhase.MaxWinners',
        {
            v9340: ElectionProviderMultiPhaseMaxWinnersConstant,
        }
    ),
    MinerMaxIterations: createConstant(
        'ElectionProviderMultiPhase.MinerMaxIterations',
        {
            v9090: ElectionProviderMultiPhaseMinerMaxIterationsConstant,
        }
    ),
    MinerMaxLength: createConstant(
        'ElectionProviderMultiPhase.MinerMaxLength',
        {
            v9090: ElectionProviderMultiPhaseMinerMaxLengthConstant,
        }
    ),
    MinerMaxVotesPerVoter: createConstant(
        'ElectionProviderMultiPhase.MinerMaxVotesPerVoter',
        {
            v9300: ElectionProviderMultiPhaseMinerMaxVotesPerVoterConstant,
        }
    ),
    MinerMaxWeight: createConstant(
        'ElectionProviderMultiPhase.MinerMaxWeight',
        {
            v9090: ElectionProviderMultiPhaseMinerMaxWeightConstant,
            v9300: ElectionProviderMultiPhaseMinerMaxWeightConstant,
            v9320: ElectionProviderMultiPhaseMinerMaxWeightConstant,
        }
    ),
    MinerMaxWinners: createConstant(
        'ElectionProviderMultiPhase.MinerMaxWinners',
        {
            v9420: ElectionProviderMultiPhaseMinerMaxWinnersConstant,
        }
    ),
    MinerTxPriority: createConstant(
        'ElectionProviderMultiPhase.MinerTxPriority',
        {
            v9090: ElectionProviderMultiPhaseMinerTxPriorityConstant,
        }
    ),
    OffchainRepeat: createConstant(
        'ElectionProviderMultiPhase.OffchainRepeat',
        {
            v9010: ElectionProviderMultiPhaseOffchainRepeatConstant,
        }
    ),
    SignedDepositBase: createConstant(
        'ElectionProviderMultiPhase.SignedDepositBase',
        {
            v9080: ElectionProviderMultiPhaseSignedDepositBaseConstant,
        }
    ),
    SignedDepositByte: createConstant(
        'ElectionProviderMultiPhase.SignedDepositByte',
        {
            v9080: ElectionProviderMultiPhaseSignedDepositByteConstant,
        }
    ),
    SignedDepositWeight: createConstant(
        'ElectionProviderMultiPhase.SignedDepositWeight',
        {
            v9080: ElectionProviderMultiPhaseSignedDepositWeightConstant,
        }
    ),
    SignedMaxRefunds: createConstant(
        'ElectionProviderMultiPhase.SignedMaxRefunds',
        {
            v9220: ElectionProviderMultiPhaseSignedMaxRefundsConstant,
        }
    ),
    SignedMaxSubmissions: createConstant(
        'ElectionProviderMultiPhase.SignedMaxSubmissions',
        {
            v9080: ElectionProviderMultiPhaseSignedMaxSubmissionsConstant,
        }
    ),
    SignedMaxWeight: createConstant(
        'ElectionProviderMultiPhase.SignedMaxWeight',
        {
            v9080: ElectionProviderMultiPhaseSignedMaxWeightConstant,
            v9291: ElectionProviderMultiPhaseSignedMaxWeightConstant,
            v9320: ElectionProviderMultiPhaseSignedMaxWeightConstant,
        }
    ),
    SignedPhase: createConstant(
        'ElectionProviderMultiPhase.SignedPhase',
        {
            v2029: ElectionProviderMultiPhaseSignedPhaseConstant,
        }
    ),
    SignedRewardBase: createConstant(
        'ElectionProviderMultiPhase.SignedRewardBase',
        {
            v9080: ElectionProviderMultiPhaseSignedRewardBaseConstant,
        }
    ),
    SolutionImprovementThreshold: createConstant(
        'ElectionProviderMultiPhase.SolutionImprovementThreshold',
        {
            v2029: ElectionProviderMultiPhaseSolutionImprovementThresholdConstant,
        }
    ),
    UnsignedPhase: createConstant(
        'ElectionProviderMultiPhase.UnsignedPhase',
        {
            v2029: ElectionProviderMultiPhaseUnsignedPhaseConstant,
        }
    ),
    VoterSnapshotPerBlock: createConstant(
        'ElectionProviderMultiPhase.VoterSnapshotPerBlock',
        {
            v9111: ElectionProviderMultiPhaseVoterSnapshotPerBlockConstant,
        }
    ),
}

export const storage = {
    CurrentPhase: createStorage(
        'ElectionProviderMultiPhase.CurrentPhase',
        {
            v2029: ElectionProviderMultiPhaseCurrentPhaseStorage,
        }
    ),
    DesiredTargets: createStorage(
        'ElectionProviderMultiPhase.DesiredTargets',
        {
            v2029: ElectionProviderMultiPhaseDesiredTargetsStorage,
        }
    ),
    MinimumUntrustedScore: createStorage(
        'ElectionProviderMultiPhase.MinimumUntrustedScore',
        {
            v9040: ElectionProviderMultiPhaseMinimumUntrustedScoreStorage,
            v9180: ElectionProviderMultiPhaseMinimumUntrustedScoreStorage,
        }
    ),
    QueuedSolution: createStorage(
        'ElectionProviderMultiPhase.QueuedSolution',
        {
            v2029: ElectionProviderMultiPhaseQueuedSolutionStorage,
            v9111: ElectionProviderMultiPhaseQueuedSolutionStorage,
            v9180: ElectionProviderMultiPhaseQueuedSolutionStorage,
        }
    ),
    Round: createStorage(
        'ElectionProviderMultiPhase.Round',
        {
            v2029: ElectionProviderMultiPhaseRoundStorage,
        }
    ),
    SignedSubmissionIndices: createStorage(
        'ElectionProviderMultiPhase.SignedSubmissionIndices',
        {
            v9080: ElectionProviderMultiPhaseSignedSubmissionIndicesStorage,
            v9180: ElectionProviderMultiPhaseSignedSubmissionIndicesStorage,
            v9340: ElectionProviderMultiPhaseSignedSubmissionIndicesStorage,
        }
    ),
    SignedSubmissionNextIndex: createStorage(
        'ElectionProviderMultiPhase.SignedSubmissionNextIndex',
        {
            v9080: ElectionProviderMultiPhaseSignedSubmissionNextIndexStorage,
        }
    ),
    SignedSubmissionsMap: createStorage(
        'ElectionProviderMultiPhase.SignedSubmissionsMap',
        {
            v9080: ElectionProviderMultiPhaseSignedSubmissionsMapStorage,
            v9111: ElectionProviderMultiPhaseSignedSubmissionsMapStorage,
            v9160: ElectionProviderMultiPhaseSignedSubmissionsMapStorage,
            v9180: ElectionProviderMultiPhaseSignedSubmissionsMapStorage,
            v9220: ElectionProviderMultiPhaseSignedSubmissionsMapStorage,
        }
    ),
    Snapshot: createStorage(
        'ElectionProviderMultiPhase.Snapshot',
        {
            v2029: ElectionProviderMultiPhaseSnapshotStorage,
        }
    ),
    SnapshotMetadata: createStorage(
        'ElectionProviderMultiPhase.SnapshotMetadata',
        {
            v2029: ElectionProviderMultiPhaseSnapshotMetadataStorage,
        }
    ),
}

export default {events, calls, constants}
