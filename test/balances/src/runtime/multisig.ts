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

export const events = {
    MultisigApproval: createEvent(
        'Multisig.MultisigApproval',
        {
            v2005: v2005.MultisigMultisigApprovalEvent,
            v9130: v9130.MultisigMultisigApprovalEvent,
        }
    ),
    MultisigCancelled: createEvent(
        'Multisig.MultisigCancelled',
        {
            v2005: v2005.MultisigMultisigCancelledEvent,
            v9130: v9130.MultisigMultisigCancelledEvent,
        }
    ),
    MultisigExecuted: createEvent(
        'Multisig.MultisigExecuted',
        {
            v2005: v2005.MultisigMultisigExecutedEvent,
            v9111: v9111.MultisigMultisigExecutedEvent,
            v9130: v9130.MultisigMultisigExecutedEvent,
            v9160: v9160.MultisigMultisigExecutedEvent,
            v9170: v9170.MultisigMultisigExecutedEvent,
            v9190: v9190.MultisigMultisigExecutedEvent,
            v9320: v9320.MultisigMultisigExecutedEvent,
            v9420: v9420.MultisigMultisigExecutedEvent,
            v9430: v9430.MultisigMultisigExecutedEvent,
        }
    ),
    NewMultisig: createEvent(
        'Multisig.NewMultisig',
        {
            v2005: v2005.MultisigNewMultisigEvent,
            v9130: v9130.MultisigNewMultisigEvent,
        }
    ),
    Uncallable: createEvent(
        'Multisig.Uncallable',
        {
            v2005: v2005.MultisigUncallableEvent,
        }
    ),
}

export const calls = {
    approve_as_multi: createCall(
        'Multisig.approve_as_multi',
        {
            v2005: v2005.MultisigApproveAsMultiCall,
            v2011: v2011.MultisigApproveAsMultiCall,
            v9111: v9111.MultisigApproveAsMultiCall,
            v9291: v9291.MultisigApproveAsMultiCall,
            v9320: v9320.MultisigApproveAsMultiCall,
        }
    ),
    as_multi: createCall(
        'Multisig.as_multi',
        {
            v2005: v2005.MultisigAsMultiCall,
            v2007: v2007.MultisigAsMultiCall,
            v2011: v2011.MultisigAsMultiCall,
            v9111: v9111.MultisigAsMultiCall,
            v9291: v9291.MultisigAsMultiCall,
            v9320: v9320.MultisigAsMultiCall,
            v9340: v9340.MultisigAsMultiCall,
            v9350: v9350.MultisigAsMultiCall,
            v9370: v9370.MultisigAsMultiCall,
            v9381: v9381.MultisigAsMultiCall,
            v9420: v9420.MultisigAsMultiCall,
            v9430: v9430.MultisigAsMultiCall,
        }
    ),
    as_multi_threshold_1: createCall(
        'Multisig.as_multi_threshold_1',
        {
            v2011: v2011.MultisigAsMultiThreshold1Call,
            v2013: v2013.MultisigAsMultiThreshold1Call,
            v2015: v2015.MultisigAsMultiThreshold1Call,
            v2022: v2022.MultisigAsMultiThreshold1Call,
            v2023: v2023.MultisigAsMultiThreshold1Call,
            v2024: v2024.MultisigAsMultiThreshold1Call,
            v2025: v2025.MultisigAsMultiThreshold1Call,
            v2026: v2026.MultisigAsMultiThreshold1Call,
            v2028: v2028.MultisigAsMultiThreshold1Call,
            v2029: v2029.MultisigAsMultiThreshold1Call,
            v2030: v2030.MultisigAsMultiThreshold1Call,
            v9010: v9010.MultisigAsMultiThreshold1Call,
            v9030: v9030.MultisigAsMultiThreshold1Call,
            v9040: v9040.MultisigAsMultiThreshold1Call,
            v9050: v9050.MultisigAsMultiThreshold1Call,
            v9080: v9080.MultisigAsMultiThreshold1Call,
            v9090: v9090.MultisigAsMultiThreshold1Call,
            v9100: v9100.MultisigAsMultiThreshold1Call,
            v9111: v9111.MultisigAsMultiThreshold1Call,
            v9122: v9122.MultisigAsMultiThreshold1Call,
            v9130: v9130.MultisigAsMultiThreshold1Call,
            v9160: v9160.MultisigAsMultiThreshold1Call,
            v9170: v9170.MultisigAsMultiThreshold1Call,
            v9180: v9180.MultisigAsMultiThreshold1Call,
            v9190: v9190.MultisigAsMultiThreshold1Call,
            v9220: v9220.MultisigAsMultiThreshold1Call,
            v9230: v9230.MultisigAsMultiThreshold1Call,
            v9250: v9250.MultisigAsMultiThreshold1Call,
            v9271: v9271.MultisigAsMultiThreshold1Call,
            v9291: v9291.MultisigAsMultiThreshold1Call,
            v9300: v9300.MultisigAsMultiThreshold1Call,
            v9320: v9320.MultisigAsMultiThreshold1Call,
            v9340: v9340.MultisigAsMultiThreshold1Call,
            v9350: v9350.MultisigAsMultiThreshold1Call,
            v9370: v9370.MultisigAsMultiThreshold1Call,
            v9381: v9381.MultisigAsMultiThreshold1Call,
            v9420: v9420.MultisigAsMultiThreshold1Call,
            v9430: v9430.MultisigAsMultiThreshold1Call,
        }
    ),
    cancel_as_multi: createCall(
        'Multisig.cancel_as_multi',
        {
            v2005: v2005.MultisigCancelAsMultiCall,
            v9111: v9111.MultisigCancelAsMultiCall,
        }
    ),
}

export const constants = {
    DepositBase: createConstant(
        'Multisig.DepositBase',
        {
            v2024: v2024.MultisigDepositBaseConstant,
        }
    ),
    DepositFactor: createConstant(
        'Multisig.DepositFactor',
        {
            v2024: v2024.MultisigDepositFactorConstant,
        }
    ),
    MaxSignatories: createConstant(
        'Multisig.MaxSignatories',
        {
            v2024: v2024.MultisigMaxSignatoriesConstant,
        }
    ),
}

export const storage = {
    Calls: createStorage(
        'Multisig.Calls',
        {
            v2011: v2011.MultisigCallsStorage,
        }
    ),
    Multisigs: createStorage(
        'Multisig.Multisigs',
        {
            v2005: v2005.MultisigMultisigsStorage,
        }
    ),
}

export default {events, calls, constants}
