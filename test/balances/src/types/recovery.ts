import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    AccountRecovered: createEvent(
        'Recovery.AccountRecovered',
        {
            v1040: RecoveryAccountRecoveredEvent,
            v9130: RecoveryAccountRecoveredEvent,
        }
    ),
    RecoveryClosed: createEvent(
        'Recovery.RecoveryClosed',
        {
            v1040: RecoveryRecoveryClosedEvent,
            v9130: RecoveryRecoveryClosedEvent,
        }
    ),
    RecoveryCreated: createEvent(
        'Recovery.RecoveryCreated',
        {
            v1040: RecoveryRecoveryCreatedEvent,
            v9130: RecoveryRecoveryCreatedEvent,
        }
    ),
    RecoveryInitiated: createEvent(
        'Recovery.RecoveryInitiated',
        {
            v1040: RecoveryRecoveryInitiatedEvent,
            v9130: RecoveryRecoveryInitiatedEvent,
        }
    ),
    RecoveryRemoved: createEvent(
        'Recovery.RecoveryRemoved',
        {
            v1040: RecoveryRecoveryRemovedEvent,
            v9130: RecoveryRecoveryRemovedEvent,
        }
    ),
    RecoveryVouched: createEvent(
        'Recovery.RecoveryVouched',
        {
            v1040: RecoveryRecoveryVouchedEvent,
            v9130: RecoveryRecoveryVouchedEvent,
        }
    ),
}

export const calls = {
    as_recovered: createCall(
        'Recovery.as_recovered',
        {
            v1040: RecoveryAsRecoveredCall,
            v1042: RecoveryAsRecoveredCall,
            v1050: RecoveryAsRecoveredCall,
            v1054: RecoveryAsRecoveredCall,
            v1055: RecoveryAsRecoveredCall,
            v1058: RecoveryAsRecoveredCall,
            v1062: RecoveryAsRecoveredCall,
            v2005: RecoveryAsRecoveredCall,
            v2007: RecoveryAsRecoveredCall,
            v2011: RecoveryAsRecoveredCall,
            v2013: RecoveryAsRecoveredCall,
            v2015: RecoveryAsRecoveredCall,
            v2022: RecoveryAsRecoveredCall,
            v2023: RecoveryAsRecoveredCall,
            v2024: RecoveryAsRecoveredCall,
            v2025: RecoveryAsRecoveredCall,
            v2026: RecoveryAsRecoveredCall,
            v2028: RecoveryAsRecoveredCall,
            v2029: RecoveryAsRecoveredCall,
            v2030: RecoveryAsRecoveredCall,
            v9010: RecoveryAsRecoveredCall,
            v9030: RecoveryAsRecoveredCall,
            v9040: RecoveryAsRecoveredCall,
            v9050: RecoveryAsRecoveredCall,
            v9080: RecoveryAsRecoveredCall,
            v9090: RecoveryAsRecoveredCall,
            v9100: RecoveryAsRecoveredCall,
            v9111: RecoveryAsRecoveredCall,
            v9122: RecoveryAsRecoveredCall,
            v9130: RecoveryAsRecoveredCall,
            v9160: RecoveryAsRecoveredCall,
            v9170: RecoveryAsRecoveredCall,
            v9180: RecoveryAsRecoveredCall,
            v9190: RecoveryAsRecoveredCall,
            v9220: RecoveryAsRecoveredCall,
            v9230: RecoveryAsRecoveredCall,
            v9250: RecoveryAsRecoveredCall,
            v9271: RecoveryAsRecoveredCall,
            v9291: RecoveryAsRecoveredCall,
            v9300: RecoveryAsRecoveredCall,
            v9320: RecoveryAsRecoveredCall,
            v9340: RecoveryAsRecoveredCall,
            v9350: RecoveryAsRecoveredCall,
            v9370: RecoveryAsRecoveredCall,
            v9381: RecoveryAsRecoveredCall,
            v9420: RecoveryAsRecoveredCall,
            v9430: RecoveryAsRecoveredCall,
        }
    ),
    cancel_recovered: createCall(
        'Recovery.cancel_recovered',
        {
            v1050: RecoveryCancelRecoveredCall,
            v9291: RecoveryCancelRecoveredCall,
        }
    ),
    claim_recovery: createCall(
        'Recovery.claim_recovery',
        {
            v1040: RecoveryClaimRecoveryCall,
            v9291: RecoveryClaimRecoveryCall,
        }
    ),
    close_recovery: createCall(
        'Recovery.close_recovery',
        {
            v1040: RecoveryCloseRecoveryCall,
            v9291: RecoveryCloseRecoveryCall,
        }
    ),
    create_recovery: createCall(
        'Recovery.create_recovery',
        {
            v1040: RecoveryCreateRecoveryCall,
            v9111: RecoveryCreateRecoveryCall,
        }
    ),
    initiate_recovery: createCall(
        'Recovery.initiate_recovery',
        {
            v1040: RecoveryInitiateRecoveryCall,
            v9291: RecoveryInitiateRecoveryCall,
        }
    ),
    remove_recovery: createCall(
        'Recovery.remove_recovery',
        {
            v1040: RecoveryRemoveRecoveryCall,
        }
    ),
    set_recovered: createCall(
        'Recovery.set_recovered',
        {
            v1040: RecoverySetRecoveredCall,
            v9291: RecoverySetRecoveredCall,
        }
    ),
    vouch_recovery: createCall(
        'Recovery.vouch_recovery',
        {
            v1040: RecoveryVouchRecoveryCall,
            v9291: RecoveryVouchRecoveryCall,
        }
    ),
}

export const constants = {
    ConfigDepositBase: createConstant(
        'Recovery.ConfigDepositBase',
        {
            v2011: RecoveryConfigDepositBaseConstant,
        }
    ),
    FriendDepositFactor: createConstant(
        'Recovery.FriendDepositFactor',
        {
            v2011: RecoveryFriendDepositFactorConstant,
        }
    ),
    MaxFriends: createConstant(
        'Recovery.MaxFriends',
        {
            v2011: RecoveryMaxFriendsConstant,
        }
    ),
    RecoveryDeposit: createConstant(
        'Recovery.RecoveryDeposit',
        {
            v2011: RecoveryRecoveryDepositConstant,
        }
    ),
}

export const storage = {
    ActiveRecoveries: createStorage(
        'Recovery.ActiveRecoveries',
        {
            v1040: RecoveryActiveRecoveriesStorage,
        }
    ),
    Proxy: createStorage(
        'Recovery.Proxy',
        {
            v1050: RecoveryProxyStorage,
        }
    ),
    Recoverable: createStorage(
        'Recovery.Recoverable',
        {
            v1040: RecoveryRecoverableStorage,
        }
    ),
    Recovered: createStorage(
        'Recovery.Recovered',
        {
            v1040: RecoveryRecoveredStorage,
        }
    ),
}

export default {events, calls, constants}
