import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    CodeUpdated: createEvent(
        'System.CodeUpdated',
        {
            v1045: SystemCodeUpdatedEvent,
        }
    ),
    ExtrinsicFailed: createEvent(
        'System.ExtrinsicFailed',
        {
            v1020: SystemExtrinsicFailedEvent,
            v1032: SystemExtrinsicFailedEvent,
            v1058: SystemExtrinsicFailedEvent,
            v1062: SystemExtrinsicFailedEvent,
            v9111: SystemExtrinsicFailedEvent,
            v9160: SystemExtrinsicFailedEvent,
            v9170: SystemExtrinsicFailedEvent,
            v9190: SystemExtrinsicFailedEvent,
            v9291: SystemExtrinsicFailedEvent,
            v9320: SystemExtrinsicFailedEvent,
            v9420: SystemExtrinsicFailedEvent,
            v9430: SystemExtrinsicFailedEvent,
        }
    ),
    ExtrinsicSuccess: createEvent(
        'System.ExtrinsicSuccess',
        {
            v1020: SystemExtrinsicSuccessEvent,
            v1058: SystemExtrinsicSuccessEvent,
            v1062: SystemExtrinsicSuccessEvent,
            v9160: SystemExtrinsicSuccessEvent,
            v9291: SystemExtrinsicSuccessEvent,
            v9320: SystemExtrinsicSuccessEvent,
        }
    ),
    KilledAccount: createEvent(
        'System.KilledAccount',
        {
            v1050: SystemKilledAccountEvent,
            v9160: SystemKilledAccountEvent,
        }
    ),
    NewAccount: createEvent(
        'System.NewAccount',
        {
            v1050: SystemNewAccountEvent,
            v9160: SystemNewAccountEvent,
        }
    ),
    Remarked: createEvent(
        'System.Remarked',
        {
            v2030: SystemRemarkedEvent,
            v9160: SystemRemarkedEvent,
        }
    ),
}

export const calls = {
    fill_block: createCall(
        'System.fill_block',
        {
            v1020: SystemFillBlockCall,
            v1050: SystemFillBlockCall,
            v9111: SystemFillBlockCall,
        }
    ),
    kill_prefix: createCall(
        'System.kill_prefix',
        {
            v1020: SystemKillPrefixCall,
            v2005: SystemKillPrefixCall,
            v9111: SystemKillPrefixCall,
        }
    ),
    kill_storage: createCall(
        'System.kill_storage',
        {
            v1020: SystemKillStorageCall,
        }
    ),
    migrate_accounts: createCall(
        'System.migrate_accounts',
        {
            v1054: SystemMigrateAccountsCall,
        }
    ),
    remark: createCall(
        'System.remark',
        {
            v1020: SystemRemarkCall,
            v9111: SystemRemarkCall,
        }
    ),
    remark_with_event: createCall(
        'System.remark_with_event',
        {
            v2030: SystemRemarkWithEventCall,
        }
    ),
    set_changes_trie_config: createCall(
        'System.set_changes_trie_config',
        {
            v1042: SystemSetChangesTrieConfigCall,
            v9111: SystemSetChangesTrieConfigCall,
        }
    ),
    set_code: createCall(
        'System.set_code',
        {
            v1020: SystemSetCodeCall,
            v1042: SystemSetCodeCall,
        }
    ),
    set_code_without_checks: createCall(
        'System.set_code_without_checks',
        {
            v1042: SystemSetCodeWithoutChecksCall,
        }
    ),
    set_heap_pages: createCall(
        'System.set_heap_pages',
        {
            v1020: SystemSetHeapPagesCall,
        }
    ),
    set_storage: createCall(
        'System.set_storage',
        {
            v1020: SystemSetStorageCall,
        }
    ),
    suicide: createCall(
        'System.suicide',
        {
            v1050: SystemSuicideCall,
        }
    ),
}

export const constants = {
    BlockExecutionWeight: createConstant(
        'System.BlockExecutionWeight',
        {
            v1062: SystemBlockExecutionWeightConstant,
        }
    ),
    BlockHashCount: createConstant(
        'System.BlockHashCount',
        {
            v2005: SystemBlockHashCountConstant,
        }
    ),
    BlockLength: createConstant(
        'System.BlockLength',
        {
            v2028: SystemBlockLengthConstant,
        }
    ),
    BlockWeights: createConstant(
        'System.BlockWeights',
        {
            v2027: SystemBlockWeightsConstant,
            v9291: SystemBlockWeightsConstant,
            v9320: SystemBlockWeightsConstant,
        }
    ),
    DbWeight: createConstant(
        'System.DbWeight',
        {
            v1062: SystemDbWeightConstant,
        }
    ),
    ExtrinsicBaseWeight: createConstant(
        'System.ExtrinsicBaseWeight',
        {
            v1062: SystemExtrinsicBaseWeightConstant,
        }
    ),
    MaximumBlockLength: createConstant(
        'System.MaximumBlockLength',
        {
            v1062: SystemMaximumBlockLengthConstant,
        }
    ),
    MaximumBlockWeight: createConstant(
        'System.MaximumBlockWeight',
        {
            v1062: SystemMaximumBlockWeightConstant,
        }
    ),
    SS58Prefix: createConstant(
        'System.SS58Prefix',
        {
            v2028: SystemSs58PrefixConstant,
        }
    ),
    Version: createConstant(
        'System.Version',
        {
            v2028: SystemVersionConstant,
            v9160: SystemVersionConstant,
        }
    ),
}

export const storage = {
    Account: createStorage(
        'System.Account',
        {
            v1050: SystemAccountStorage,
            v2028: SystemAccountStorage,
            v2030: SystemAccountStorage,
            v9420: SystemAccountStorage,
        }
    ),
    AccountNonce: createStorage(
        'System.AccountNonce',
        {
            v1020: SystemAccountNonceStorage,
        }
    ),
    AllExtrinsicsLen: createStorage(
        'System.AllExtrinsicsLen',
        {
            v1020: SystemAllExtrinsicsLenStorage,
        }
    ),
    AllExtrinsicsWeight: createStorage(
        'System.AllExtrinsicsWeight',
        {
            v1020: SystemAllExtrinsicsWeightStorage,
            v1058: SystemAllExtrinsicsWeightStorage,
        }
    ),
    BlockHash: createStorage(
        'System.BlockHash',
        {
            v1020: SystemBlockHashStorage,
        }
    ),
    BlockWeight: createStorage(
        'System.BlockWeight',
        {
            v2005: SystemBlockWeightStorage,
            v2027: SystemBlockWeightStorage,
            v9291: SystemBlockWeightStorage,
            v9320: SystemBlockWeightStorage,
        }
    ),
    Digest: createStorage(
        'System.Digest',
        {
            v1020: SystemDigestStorage,
            v9111: SystemDigestStorage,
            v9130: SystemDigestStorage,
        }
    ),
    EventCount: createStorage(
        'System.EventCount',
        {
            v1020: SystemEventCountStorage,
        }
    ),
    EventTopics: createStorage(
        'System.EventTopics',
        {
            v1020: SystemEventTopicsStorage,
            v1038: SystemEventTopicsStorage,
        }
    ),
    Events: createStorage(
        'System.Events',
        {
            v1020: SystemEventsStorage,
            v1022: SystemEventsStorage,
            v1027: SystemEventsStorage,
            v1029: SystemEventsStorage,
            v1030: SystemEventsStorage,
            v1031: SystemEventsStorage,
            v1032: SystemEventsStorage,
            v1038: SystemEventsStorage,
            v1040: SystemEventsStorage,
            v1042: SystemEventsStorage,
            v1045: SystemEventsStorage,
            v1050: SystemEventsStorage,
            v1051: SystemEventsStorage,
            v1058: SystemEventsStorage,
            v1062: SystemEventsStorage,
            v2005: SystemEventsStorage,
            v2007: SystemEventsStorage,
            v2008: SystemEventsStorage,
            v2011: SystemEventsStorage,
            v2015: SystemEventsStorage,
            v2023: SystemEventsStorage,
            v2024: SystemEventsStorage,
            v2025: SystemEventsStorage,
            v2027: SystemEventsStorage,
            v2028: SystemEventsStorage,
            v2029: SystemEventsStorage,
            v2030: SystemEventsStorage,
            v9010: SystemEventsStorage,
            v9040: SystemEventsStorage,
            v9050: SystemEventsStorage,
            v9080: SystemEventsStorage,
            v9090: SystemEventsStorage,
            v9100: SystemEventsStorage,
            v9111: SystemEventsStorage,
            v9122: SystemEventsStorage,
            v9130: SystemEventsStorage,
            v9160: SystemEventsStorage,
            v9170: SystemEventsStorage,
            v9180: SystemEventsStorage,
            v9190: SystemEventsStorage,
            v9200: SystemEventsStorage,
            v9220: SystemEventsStorage,
            v9230: SystemEventsStorage,
            v9250: SystemEventsStorage,
            v9260: SystemEventsStorage,
            v9271: SystemEventsStorage,
            v9291: SystemEventsStorage,
            v9300: SystemEventsStorage,
            v9320: SystemEventsStorage,
            v9340: SystemEventsStorage,
            v9350: SystemEventsStorage,
            v9370: SystemEventsStorage,
            v9381: SystemEventsStorage,
            v9420: SystemEventsStorage,
            v9430: SystemEventsStorage,
        }
    ),
    ExecutionPhase: createStorage(
        'System.ExecutionPhase',
        {
            v1055: SystemExecutionPhaseStorage,
        }
    ),
    ExtrinsicCount: createStorage(
        'System.ExtrinsicCount',
        {
            v1020: SystemExtrinsicCountStorage,
        }
    ),
    ExtrinsicData: createStorage(
        'System.ExtrinsicData',
        {
            v1020: SystemExtrinsicDataStorage,
        }
    ),
    ExtrinsicsRoot: createStorage(
        'System.ExtrinsicsRoot',
        {
            v1020: SystemExtrinsicsRootStorage,
        }
    ),
    LastRuntimeUpgrade: createStorage(
        'System.LastRuntimeUpgrade',
        {
            v1053: SystemLastRuntimeUpgradeStorage,
        }
    ),
    Number: createStorage(
        'System.Number',
        {
            v1020: SystemNumberStorage,
        }
    ),
    ParentHash: createStorage(
        'System.ParentHash',
        {
            v1020: SystemParentHashStorage,
        }
    ),
    RuntimeUpgraded: createStorage(
        'System.RuntimeUpgraded',
        {
            v1050: SystemRuntimeUpgradedStorage,
        }
    ),
    UpgradedToDualRefCount: createStorage(
        'System.UpgradedToDualRefCount',
        {
            v2028: SystemUpgradedToDualRefCountStorage,
        }
    ),
    UpgradedToTripleRefCount: createStorage(
        'System.UpgradedToTripleRefCount',
        {
            v2030: SystemUpgradedToTripleRefCountStorage,
        }
    ),
    UpgradedToU32RefCount: createStorage(
        'System.UpgradedToU32RefCount',
        {
            v2025: SystemUpgradedToU32RefCountStorage,
        }
    ),
}

export default {events, calls, constants}
