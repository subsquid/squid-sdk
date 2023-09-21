import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9430 from './types/v9430'
import * as v9420 from './types/v9420'
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

export const events = {
    AccountRecovered: createEvent(
        'Recovery.AccountRecovered',
        {
            v1040: v1040.RecoveryAccountRecoveredEvent,
            v9130: v9130.RecoveryAccountRecoveredEvent,
        }
    ),
    RecoveryClosed: createEvent(
        'Recovery.RecoveryClosed',
        {
            v1040: v1040.RecoveryRecoveryClosedEvent,
            v9130: v9130.RecoveryRecoveryClosedEvent,
        }
    ),
    RecoveryCreated: createEvent(
        'Recovery.RecoveryCreated',
        {
            v1040: v1040.RecoveryRecoveryCreatedEvent,
            v9130: v9130.RecoveryRecoveryCreatedEvent,
        }
    ),
    RecoveryInitiated: createEvent(
        'Recovery.RecoveryInitiated',
        {
            v1040: v1040.RecoveryRecoveryInitiatedEvent,
            v9130: v9130.RecoveryRecoveryInitiatedEvent,
        }
    ),
    RecoveryRemoved: createEvent(
        'Recovery.RecoveryRemoved',
        {
            v1040: v1040.RecoveryRecoveryRemovedEvent,
            v9130: v9130.RecoveryRecoveryRemovedEvent,
        }
    ),
    RecoveryVouched: createEvent(
        'Recovery.RecoveryVouched',
        {
            v1040: v1040.RecoveryRecoveryVouchedEvent,
            v9130: v9130.RecoveryRecoveryVouchedEvent,
        }
    ),
}

export const calls = {
    as_recovered: createCall(
        'Recovery.as_recovered',
        {
            v1040: v1040.RecoveryAsRecoveredCall,
            v1042: v1042.RecoveryAsRecoveredCall,
            v1050: v1050.RecoveryAsRecoveredCall,
            v1054: v1054.RecoveryAsRecoveredCall,
            v1055: v1055.RecoveryAsRecoveredCall,
            v1058: v1058.RecoveryAsRecoveredCall,
            v1062: v1062.RecoveryAsRecoveredCall,
            v2005: v2005.RecoveryAsRecoveredCall,
            v2007: v2007.RecoveryAsRecoveredCall,
            v2011: v2011.RecoveryAsRecoveredCall,
            v2013: v2013.RecoveryAsRecoveredCall,
            v2015: v2015.RecoveryAsRecoveredCall,
            v2022: v2022.RecoveryAsRecoveredCall,
            v2023: v2023.RecoveryAsRecoveredCall,
            v2024: v2024.RecoveryAsRecoveredCall,
            v2025: v2025.RecoveryAsRecoveredCall,
            v2026: v2026.RecoveryAsRecoveredCall,
            v2028: v2028.RecoveryAsRecoveredCall,
            v2029: v2029.RecoveryAsRecoveredCall,
            v2030: v2030.RecoveryAsRecoveredCall,
            v9010: v9010.RecoveryAsRecoveredCall,
            v9030: v9030.RecoveryAsRecoveredCall,
            v9040: v9040.RecoveryAsRecoveredCall,
            v9050: v9050.RecoveryAsRecoveredCall,
            v9080: v9080.RecoveryAsRecoveredCall,
            v9090: v9090.RecoveryAsRecoveredCall,
            v9100: v9100.RecoveryAsRecoveredCall,
            v9111: v9111.RecoveryAsRecoveredCall,
            v9122: v9122.RecoveryAsRecoveredCall,
            v9130: v9130.RecoveryAsRecoveredCall,
            v9160: v9160.RecoveryAsRecoveredCall,
            v9170: v9170.RecoveryAsRecoveredCall,
            v9180: v9180.RecoveryAsRecoveredCall,
            v9190: v9190.RecoveryAsRecoveredCall,
            v9220: v9220.RecoveryAsRecoveredCall,
            v9230: v9230.RecoveryAsRecoveredCall,
            v9250: v9250.RecoveryAsRecoveredCall,
            v9271: v9271.RecoveryAsRecoveredCall,
            v9291: v9291.RecoveryAsRecoveredCall,
            v9300: v9300.RecoveryAsRecoveredCall,
            v9320: v9320.RecoveryAsRecoveredCall,
            v9340: v9340.RecoveryAsRecoveredCall,
            v9350: v9350.RecoveryAsRecoveredCall,
            v9370: v9370.RecoveryAsRecoveredCall,
            v9381: v9381.RecoveryAsRecoveredCall,
            v9420: v9420.RecoveryAsRecoveredCall,
            v9430: v9430.RecoveryAsRecoveredCall,
        }
    ),
    cancel_recovered: createCall(
        'Recovery.cancel_recovered',
        {
            v1050: v1050.RecoveryCancelRecoveredCall,
            v9291: v9291.RecoveryCancelRecoveredCall,
        }
    ),
    claim_recovery: createCall(
        'Recovery.claim_recovery',
        {
            v1040: v1040.RecoveryClaimRecoveryCall,
            v9291: v9291.RecoveryClaimRecoveryCall,
        }
    ),
    close_recovery: createCall(
        'Recovery.close_recovery',
        {
            v1040: v1040.RecoveryCloseRecoveryCall,
            v9291: v9291.RecoveryCloseRecoveryCall,
        }
    ),
    create_recovery: createCall(
        'Recovery.create_recovery',
        {
            v1040: v1040.RecoveryCreateRecoveryCall,
            v9111: v9111.RecoveryCreateRecoveryCall,
        }
    ),
    initiate_recovery: createCall(
        'Recovery.initiate_recovery',
        {
            v1040: v1040.RecoveryInitiateRecoveryCall,
            v9291: v9291.RecoveryInitiateRecoveryCall,
        }
    ),
    remove_recovery: createCall(
        'Recovery.remove_recovery',
        {
            v1040: v1040.RecoveryRemoveRecoveryCall,
        }
    ),
    set_recovered: createCall(
        'Recovery.set_recovered',
        {
            v1040: v1040.RecoverySetRecoveredCall,
            v9291: v9291.RecoverySetRecoveredCall,
        }
    ),
    vouch_recovery: createCall(
        'Recovery.vouch_recovery',
        {
            v1040: v1040.RecoveryVouchRecoveryCall,
            v9291: v9291.RecoveryVouchRecoveryCall,
        }
    ),
}

export const constants = {
    ConfigDepositBase: createConstant(
        'Recovery.ConfigDepositBase',
        {
            v2011: v2011.RecoveryConfigDepositBaseConstant,
        }
    ),
    FriendDepositFactor: createConstant(
        'Recovery.FriendDepositFactor',
        {
            v2011: v2011.RecoveryFriendDepositFactorConstant,
        }
    ),
    MaxFriends: createConstant(
        'Recovery.MaxFriends',
        {
            v2011: v2011.RecoveryMaxFriendsConstant,
        }
    ),
    RecoveryDeposit: createConstant(
        'Recovery.RecoveryDeposit',
        {
            v2011: v2011.RecoveryRecoveryDepositConstant,
        }
    ),
}

export const storage = {
    ActiveRecoveries: createStorage(
        'Recovery.ActiveRecoveries',
        {
            v1040: v1040.RecoveryActiveRecoveriesStorage,
        }
    ),
    Proxy: createStorage(
        'Recovery.Proxy',
        {
            v1050: v1050.RecoveryProxyStorage,
        }
    ),
    Recoverable: createStorage(
        'Recovery.Recoverable',
        {
            v1040: v1040.RecoveryRecoverableStorage,
        }
    ),
    Recovered: createStorage(
        'Recovery.Recovered',
        {
            v1040: v1040.RecoveryRecoveredStorage,
        }
    ),
}

export default {events, calls, constants}
