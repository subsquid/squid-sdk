import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    plan_config_change: createCall(
        'Babe.plan_config_change',
        {
            v2030: BabePlanConfigChangeCall,
            v9111: BabePlanConfigChangeCall,
        }
    ),
    report_equivocation: createCall(
        'Babe.report_equivocation',
        {
            v2015: BabeReportEquivocationCall,
            v9111: BabeReportEquivocationCall,
            v9130: BabeReportEquivocationCall,
        }
    ),
    report_equivocation_unsigned: createCall(
        'Babe.report_equivocation_unsigned',
        {
            v2015: BabeReportEquivocationUnsignedCall,
            v9111: BabeReportEquivocationUnsignedCall,
            v9130: BabeReportEquivocationUnsignedCall,
        }
    ),
}

export const constants = {
    EpochDuration: createConstant(
        'Babe.EpochDuration',
        {
            v1020: BabeEpochDurationConstant,
        }
    ),
    ExpectedBlockTime: createConstant(
        'Babe.ExpectedBlockTime',
        {
            v1020: BabeExpectedBlockTimeConstant,
        }
    ),
    MaxAuthorities: createConstant(
        'Babe.MaxAuthorities',
        {
            v9111: BabeMaxAuthoritiesConstant,
        }
    ),
}

export const storage = {
    AuthorVrfRandomness: createStorage(
        'Babe.AuthorVrfRandomness',
        {
            v2026: BabeAuthorVrfRandomnessStorage,
        }
    ),
    Authorities: createStorage(
        'Babe.Authorities',
        {
            v1020: BabeAuthoritiesStorage,
        }
    ),
    CurrentSlot: createStorage(
        'Babe.CurrentSlot',
        {
            v1020: BabeCurrentSlotStorage,
        }
    ),
    EpochConfig: createStorage(
        'Babe.EpochConfig',
        {
            v2030: BabeEpochConfigStorage,
        }
    ),
    EpochIndex: createStorage(
        'Babe.EpochIndex',
        {
            v1020: BabeEpochIndexStorage,
        }
    ),
    EpochStart: createStorage(
        'Babe.EpochStart',
        {
            v2030: BabeEpochStartStorage,
        }
    ),
    GenesisSlot: createStorage(
        'Babe.GenesisSlot',
        {
            v1020: BabeGenesisSlotStorage,
        }
    ),
    Initialized: createStorage(
        'Babe.Initialized',
        {
            v1020: BabeInitializedStorage,
            v9220: BabeInitializedStorage,
            v9420: BabeInitializedStorage,
        }
    ),
    Lateness: createStorage(
        'Babe.Lateness',
        {
            v1058: BabeLatenessStorage,
        }
    ),
    NextAuthorities: createStorage(
        'Babe.NextAuthorities',
        {
            v2028: BabeNextAuthoritiesStorage,
        }
    ),
    NextEpochConfig: createStorage(
        'Babe.NextEpochConfig',
        {
            v2005: BabeNextEpochConfigStorage,
            v2030: BabeNextEpochConfigStorage,
        }
    ),
    NextRandomness: createStorage(
        'Babe.NextRandomness',
        {
            v1020: BabeNextRandomnessStorage,
        }
    ),
    PendingEpochConfigChange: createStorage(
        'Babe.PendingEpochConfigChange',
        {
            v2030: BabePendingEpochConfigChangeStorage,
            v9111: BabePendingEpochConfigChangeStorage,
        }
    ),
    Randomness: createStorage(
        'Babe.Randomness',
        {
            v1020: BabeRandomnessStorage,
        }
    ),
    SegmentIndex: createStorage(
        'Babe.SegmentIndex',
        {
            v1020: BabeSegmentIndexStorage,
        }
    ),
    SkippedEpochs: createStorage(
        'Babe.SkippedEpochs',
        {
            v9420: BabeSkippedEpochsStorage,
        }
    ),
    UnderConstruction: createStorage(
        'Babe.UnderConstruction',
        {
            v1020: BabeUnderConstructionStorage,
        }
    ),
}

export default {calls, constants}
