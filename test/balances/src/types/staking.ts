import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Bonded: createEvent(
        'Staking.Bonded',
        {
            v1051: StakingBondedEvent,
            v9300: StakingBondedEvent,
        }
    ),
    Chilled: createEvent(
        'Staking.Chilled',
        {
            v9090: StakingChilledEvent,
            v9300: StakingChilledEvent,
        }
    ),
    EraPaid: createEvent(
        'Staking.EraPaid',
        {
            v9090: StakingEraPaidEvent,
            v9300: StakingEraPaidEvent,
        }
    ),
    EraPayout: createEvent(
        'Staking.EraPayout',
        {
            v1062: StakingEraPayoutEvent,
        }
    ),
    ForceEra: createEvent(
        'Staking.ForceEra',
        {
            v9370: StakingForceEraEvent,
        }
    ),
    Kicked: createEvent(
        'Staking.Kicked',
        {
            v2028: StakingKickedEvent,
            v9300: StakingKickedEvent,
        }
    ),
    OldSlashingReportDiscarded: createEvent(
        'Staking.OldSlashingReportDiscarded',
        {
            v1020: StakingOldSlashingReportDiscardedEvent,
            v9300: StakingOldSlashingReportDiscardedEvent,
        }
    ),
    PayoutStarted: createEvent(
        'Staking.PayoutStarted',
        {
            v9090: StakingPayoutStartedEvent,
            v9300: StakingPayoutStartedEvent,
        }
    ),
    Reward: createEvent(
        'Staking.Reward',
        {
            v1020: StakingRewardEvent,
            v1050: StakingRewardEvent,
        }
    ),
    Rewarded: createEvent(
        'Staking.Rewarded',
        {
            v9090: StakingRewardedEvent,
            v9300: StakingRewardedEvent,
        }
    ),
    Slash: createEvent(
        'Staking.Slash',
        {
            v1020: StakingSlashEvent,
        }
    ),
    SlashReported: createEvent(
        'Staking.SlashReported',
        {
            v9350: StakingSlashReportedEvent,
        }
    ),
    Slashed: createEvent(
        'Staking.Slashed',
        {
            v9090: StakingSlashedEvent,
            v9300: StakingSlashedEvent,
        }
    ),
    SolutionStored: createEvent(
        'Staking.SolutionStored',
        {
            v2005: StakingSolutionStoredEvent,
        }
    ),
    StakersElected: createEvent(
        'Staking.StakersElected',
        {
            v9090: StakingStakersElectedEvent,
        }
    ),
    StakingElection: createEvent(
        'Staking.StakingElection',
        {
            v1058: StakingStakingElectionEvent,
            v2030: StakingStakingElectionEvent,
        }
    ),
    StakingElectionFailed: createEvent(
        'Staking.StakingElectionFailed',
        {
            v9050: StakingStakingElectionFailedEvent,
        }
    ),
    Unbonded: createEvent(
        'Staking.Unbonded',
        {
            v1051: StakingUnbondedEvent,
            v9300: StakingUnbondedEvent,
        }
    ),
    ValidatorPrefsSet: createEvent(
        'Staking.ValidatorPrefsSet',
        {
            v9200: StakingValidatorPrefsSetEvent,
            v9300: StakingValidatorPrefsSetEvent,
        }
    ),
    Withdrawn: createEvent(
        'Staking.Withdrawn',
        {
            v1051: StakingWithdrawnEvent,
            v9300: StakingWithdrawnEvent,
        }
    ),
}

export const calls = {
    bond: createCall(
        'Staking.bond',
        {
            v1020: StakingBondCall,
            v1050: StakingBondCall,
            v2028: StakingBondCall,
            v9111: StakingBondCall,
            v9430: StakingBondCall,
        }
    ),
    bond_extra: createCall(
        'Staking.bond_extra',
        {
            v1020: StakingBondExtraCall,
            v9111: StakingBondExtraCall,
        }
    ),
    cancel_deferred_slash: createCall(
        'Staking.cancel_deferred_slash',
        {
            v1020: StakingCancelDeferredSlashCall,
            v9111: StakingCancelDeferredSlashCall,
        }
    ),
    chill: createCall(
        'Staking.chill',
        {
            v1020: StakingChillCall,
        }
    ),
    chill_other: createCall(
        'Staking.chill_other',
        {
            v9050: StakingChillOtherCall,
        }
    ),
    force_apply_min_commission: createCall(
        'Staking.force_apply_min_commission',
        {
            v9170: StakingForceApplyMinCommissionCall,
        }
    ),
    force_new_era: createCall(
        'Staking.force_new_era',
        {
            v1020: StakingForceNewEraCall,
        }
    ),
    force_new_era_always: createCall(
        'Staking.force_new_era_always',
        {
            v1020: StakingForceNewEraAlwaysCall,
        }
    ),
    force_no_eras: createCall(
        'Staking.force_no_eras',
        {
            v1020: StakingForceNoErasCall,
        }
    ),
    force_unstake: createCall(
        'Staking.force_unstake',
        {
            v1020: StakingForceUnstakeCall,
            v2005: StakingForceUnstakeCall,
            v9111: StakingForceUnstakeCall,
        }
    ),
    increase_validator_count: createCall(
        'Staking.increase_validator_count',
        {
            v2011: StakingIncreaseValidatorCountCall,
        }
    ),
    kick: createCall(
        'Staking.kick',
        {
            v2028: StakingKickCall,
            v9111: StakingKickCall,
        }
    ),
    nominate: createCall(
        'Staking.nominate',
        {
            v1020: StakingNominateCall,
            v1050: StakingNominateCall,
            v2028: StakingNominateCall,
            v9111: StakingNominateCall,
        }
    ),
    payout_nominator: createCall(
        'Staking.payout_nominator',
        {
            v1050: StakingPayoutNominatorCall,
        }
    ),
    payout_stakers: createCall(
        'Staking.payout_stakers',
        {
            v1058: StakingPayoutStakersCall,
            v9111: StakingPayoutStakersCall,
        }
    ),
    payout_validator: createCall(
        'Staking.payout_validator',
        {
            v1050: StakingPayoutValidatorCall,
        }
    ),
    reap_stash: createCall(
        'Staking.reap_stash',
        {
            v1050: StakingReapStashCall,
            v2005: StakingReapStashCall,
            v9111: StakingReapStashCall,
        }
    ),
    rebond: createCall(
        'Staking.rebond',
        {
            v1038: StakingRebondCall,
        }
    ),
    scale_validator_count: createCall(
        'Staking.scale_validator_count',
        {
            v2011: StakingScaleValidatorCountCall,
        }
    ),
    set_controller: createCall(
        'Staking.set_controller',
        {
            v1020: StakingSetControllerCall,
            v1050: StakingSetControllerCall,
            v2028: StakingSetControllerCall,
            v9111: StakingSetControllerCall,
            v9430: StakingSetControllerCall,
        }
    ),
    set_history_depth: createCall(
        'Staking.set_history_depth',
        {
            v1050: StakingSetHistoryDepthCall,
            v2005: StakingSetHistoryDepthCall,
            v9111: StakingSetHistoryDepthCall,
        }
    ),
    set_invulnerables: createCall(
        'Staking.set_invulnerables',
        {
            v1020: StakingSetInvulnerablesCall,
            v2024: StakingSetInvulnerablesCall,
        }
    ),
    set_min_commission: createCall(
        'Staking.set_min_commission',
        {
            v9370: StakingSetMinCommissionCall,
        }
    ),
    set_payee: createCall(
        'Staking.set_payee',
        {
            v1020: StakingSetPayeeCall,
        }
    ),
    set_staking_configs: createCall(
        'Staking.set_staking_configs',
        {
            v9160: StakingSetStakingConfigsCall,
            v9180: StakingSetStakingConfigsCall,
        }
    ),
    set_staking_limits: createCall(
        'Staking.set_staking_limits',
        {
            v9080: StakingSetStakingLimitsCall,
            v9111: StakingSetStakingLimitsCall,
        }
    ),
    set_validator_count: createCall(
        'Staking.set_validator_count',
        {
            v1020: StakingSetValidatorCountCall,
        }
    ),
    submit_election_solution: createCall(
        'Staking.submit_election_solution',
        {
            v1058: StakingSubmitElectionSolutionCall,
            v2005: StakingSubmitElectionSolutionCall,
            v2023: StakingSubmitElectionSolutionCall,
        }
    ),
    submit_election_solution_unsigned: createCall(
        'Staking.submit_election_solution_unsigned',
        {
            v1058: StakingSubmitElectionSolutionUnsignedCall,
            v2005: StakingSubmitElectionSolutionUnsignedCall,
            v2023: StakingSubmitElectionSolutionUnsignedCall,
        }
    ),
    unbond: createCall(
        'Staking.unbond',
        {
            v1020: StakingUnbondCall,
        }
    ),
    update_staking_limits: createCall(
        'Staking.update_staking_limits',
        {
            v9050: StakingUpdateStakingLimitsCall,
        }
    ),
    validate: createCall(
        'Staking.validate',
        {
            v1020: StakingValidateCall,
            v2028: StakingValidateCall,
        }
    ),
    withdraw_unbonded: createCall(
        'Staking.withdraw_unbonded',
        {
            v1020: StakingWithdrawUnbondedCall,
            v2005: StakingWithdrawUnbondedCall,
            v9111: StakingWithdrawUnbondedCall,
        }
    ),
}

export const constants = {
    BondingDuration: createConstant(
        'Staking.BondingDuration',
        {
            v1020: StakingBondingDurationConstant,
        }
    ),
    ElectionLookahead: createConstant(
        'Staking.ElectionLookahead',
        {
            v2012: StakingElectionLookaheadConstant,
        }
    ),
    HistoryDepth: createConstant(
        'Staking.HistoryDepth',
        {
            v9300: StakingHistoryDepthConstant,
        }
    ),
    MaxIterations: createConstant(
        'Staking.MaxIterations',
        {
            v2012: StakingMaxIterationsConstant,
        }
    ),
    MaxNominations: createConstant(
        'Staking.MaxNominations',
        {
            v2030: StakingMaxNominationsConstant,
        }
    ),
    MaxNominatorRewardedPerValidator: createConstant(
        'Staking.MaxNominatorRewardedPerValidator',
        {
            v2012: StakingMaxNominatorRewardedPerValidatorConstant,
        }
    ),
    MaxUnlockingChunks: createConstant(
        'Staking.MaxUnlockingChunks',
        {
            v9180: StakingMaxUnlockingChunksConstant,
        }
    ),
    MinSolutionScoreBump: createConstant(
        'Staking.MinSolutionScoreBump',
        {
            v2012: StakingMinSolutionScoreBumpConstant,
        }
    ),
    SessionsPerEra: createConstant(
        'Staking.SessionsPerEra',
        {
            v1020: StakingSessionsPerEraConstant,
        }
    ),
    SlashDeferDuration: createConstant(
        'Staking.SlashDeferDuration',
        {
            v2012: StakingSlashDeferDurationConstant,
        }
    ),
}

export const storage = {
    ActiveEra: createStorage(
        'Staking.ActiveEra',
        {
            v1050: StakingActiveEraStorage,
        }
    ),
    Bonded: createStorage(
        'Staking.Bonded',
        {
            v1020: StakingBondedStorage,
        }
    ),
    BondedEras: createStorage(
        'Staking.BondedEras',
        {
            v1020: StakingBondedErasStorage,
        }
    ),
    CanceledSlashPayout: createStorage(
        'Staking.CanceledSlashPayout',
        {
            v1020: StakingCanceledSlashPayoutStorage,
        }
    ),
    ChillThreshold: createStorage(
        'Staking.ChillThreshold',
        {
            v9080: StakingChillThresholdStorage,
        }
    ),
    CounterForNominators: createStorage(
        'Staking.CounterForNominators',
        {
            v9050: StakingCounterForNominatorsStorage,
        }
    ),
    CounterForValidators: createStorage(
        'Staking.CounterForValidators',
        {
            v9050: StakingCounterForValidatorsStorage,
        }
    ),
    CurrentElected: createStorage(
        'Staking.CurrentElected',
        {
            v1020: StakingCurrentElectedStorage,
        }
    ),
    CurrentEra: createStorage(
        'Staking.CurrentEra',
        {
            v1020: StakingCurrentEraStorage,
            v1050: StakingCurrentEraStorage,
        }
    ),
    CurrentEraPointsEarned: createStorage(
        'Staking.CurrentEraPointsEarned',
        {
            v1020: StakingCurrentEraPointsEarnedStorage,
        }
    ),
    CurrentEraStart: createStorage(
        'Staking.CurrentEraStart',
        {
            v1020: StakingCurrentEraStartStorage,
        }
    ),
    CurrentEraStartSessionIndex: createStorage(
        'Staking.CurrentEraStartSessionIndex',
        {
            v1020: StakingCurrentEraStartSessionIndexStorage,
        }
    ),
    CurrentPlannedSession: createStorage(
        'Staking.CurrentPlannedSession',
        {
            v2029: StakingCurrentPlannedSessionStorage,
        }
    ),
    EarliestUnappliedSlash: createStorage(
        'Staking.EarliestUnappliedSlash',
        {
            v1020: StakingEarliestUnappliedSlashStorage,
        }
    ),
    EraElectionStatus: createStorage(
        'Staking.EraElectionStatus',
        {
            v1058: StakingEraElectionStatusStorage,
        }
    ),
    ErasRewardPoints: createStorage(
        'Staking.ErasRewardPoints',
        {
            v1050: StakingErasRewardPointsStorage,
        }
    ),
    ErasStakers: createStorage(
        'Staking.ErasStakers',
        {
            v1050: StakingErasStakersStorage,
        }
    ),
    ErasStakersClipped: createStorage(
        'Staking.ErasStakersClipped',
        {
            v1050: StakingErasStakersClippedStorage,
        }
    ),
    ErasStartSessionIndex: createStorage(
        'Staking.ErasStartSessionIndex',
        {
            v1050: StakingErasStartSessionIndexStorage,
        }
    ),
    ErasTotalStake: createStorage(
        'Staking.ErasTotalStake',
        {
            v1050: StakingErasTotalStakeStorage,
        }
    ),
    ErasValidatorPrefs: createStorage(
        'Staking.ErasValidatorPrefs',
        {
            v1050: StakingErasValidatorPrefsStorage,
            v2028: StakingErasValidatorPrefsStorage,
        }
    ),
    ErasValidatorReward: createStorage(
        'Staking.ErasValidatorReward',
        {
            v1050: StakingErasValidatorRewardStorage,
        }
    ),
    ForceEra: createStorage(
        'Staking.ForceEra',
        {
            v1020: StakingForceEraStorage,
        }
    ),
    HistoryDepth: createStorage(
        'Staking.HistoryDepth',
        {
            v1050: StakingHistoryDepthStorage,
        }
    ),
    Invulnerables: createStorage(
        'Staking.Invulnerables',
        {
            v1020: StakingInvulnerablesStorage,
        }
    ),
    IsCurrentSessionFinal: createStorage(
        'Staking.IsCurrentSessionFinal',
        {
            v1058: StakingIsCurrentSessionFinalStorage,
        }
    ),
    Ledger: createStorage(
        'Staking.Ledger',
        {
            v1020: StakingLedgerStorage,
            v1050: StakingLedgerStorage,
            v1058: StakingLedgerStorage,
        }
    ),
    MaxNominatorsCount: createStorage(
        'Staking.MaxNominatorsCount',
        {
            v9050: StakingMaxNominatorsCountStorage,
        }
    ),
    MaxValidatorsCount: createStorage(
        'Staking.MaxValidatorsCount',
        {
            v9050: StakingMaxValidatorsCountStorage,
        }
    ),
    MigrateEra: createStorage(
        'Staking.MigrateEra',
        {
            v1058: StakingMigrateEraStorage,
        }
    ),
    MinCommission: createStorage(
        'Staking.MinCommission',
        {
            v9160: StakingMinCommissionStorage,
        }
    ),
    MinNominatorBond: createStorage(
        'Staking.MinNominatorBond',
        {
            v9050: StakingMinNominatorBondStorage,
        }
    ),
    MinValidatorBond: createStorage(
        'Staking.MinValidatorBond',
        {
            v9050: StakingMinValidatorBondStorage,
        }
    ),
    MinimumActiveStake: createStorage(
        'Staking.MinimumActiveStake',
        {
            v9360: StakingMinimumActiveStakeStorage,
        }
    ),
    MinimumValidatorCount: createStorage(
        'Staking.MinimumValidatorCount',
        {
            v1020: StakingMinimumValidatorCountStorage,
        }
    ),
    NominatorSlashInEra: createStorage(
        'Staking.NominatorSlashInEra',
        {
            v1020: StakingNominatorSlashInEraStorage,
        }
    ),
    Nominators: createStorage(
        'Staking.Nominators',
        {
            v1020: StakingNominatorsStorage,
        }
    ),
    OffendingValidators: createStorage(
        'Staking.OffendingValidators',
        {
            v9122: StakingOffendingValidatorsStorage,
        }
    ),
    Payee: createStorage(
        'Staking.Payee',
        {
            v1020: StakingPayeeStorage,
        }
    ),
    QueuedElected: createStorage(
        'Staking.QueuedElected',
        {
            v1058: StakingQueuedElectedStorage,
        }
    ),
    QueuedScore: createStorage(
        'Staking.QueuedScore',
        {
            v1058: StakingQueuedScoreStorage,
        }
    ),
    SlashRewardFraction: createStorage(
        'Staking.SlashRewardFraction',
        {
            v1020: StakingSlashRewardFractionStorage,
        }
    ),
    SlashingSpans: createStorage(
        'Staking.SlashingSpans',
        {
            v1020: StakingSlashingSpansStorage,
            v1045: StakingSlashingSpansStorage,
        }
    ),
    SlotStake: createStorage(
        'Staking.SlotStake',
        {
            v1020: StakingSlotStakeStorage,
        }
    ),
    SnapshotNominators: createStorage(
        'Staking.SnapshotNominators',
        {
            v1058: StakingSnapshotNominatorsStorage,
        }
    ),
    SnapshotValidators: createStorage(
        'Staking.SnapshotValidators',
        {
            v1058: StakingSnapshotValidatorsStorage,
        }
    ),
    SpanSlash: createStorage(
        'Staking.SpanSlash',
        {
            v1020: StakingSpanSlashStorage,
        }
    ),
    Stakers: createStorage(
        'Staking.Stakers',
        {
            v1020: StakingStakersStorage,
        }
    ),
    StorageVersion: createStorage(
        'Staking.StorageVersion',
        {
            v1020: StakingStorageVersionStorage,
            v1050: StakingStorageVersionStorage,
            v9111: StakingStorageVersionStorage,
            v9190: StakingStorageVersionStorage,
            v9271: StakingStorageVersionStorage,
            v9300: StakingStorageVersionStorage,
        }
    ),
    UnappliedSlashes: createStorage(
        'Staking.UnappliedSlashes',
        {
            v1020: StakingUnappliedSlashesStorage,
        }
    ),
    ValidatorCount: createStorage(
        'Staking.ValidatorCount',
        {
            v1020: StakingValidatorCountStorage,
        }
    ),
    ValidatorSlashInEra: createStorage(
        'Staking.ValidatorSlashInEra',
        {
            v1020: StakingValidatorSlashInEraStorage,
        }
    ),
    Validators: createStorage(
        'Staking.Validators',
        {
            v1020: StakingValidatorsStorage,
            v2028: StakingValidatorsStorage,
        }
    ),
}

export default {events, calls, constants}
