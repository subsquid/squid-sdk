import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    MultisigApproval: createEvent(
        'Multisig.MultisigApproval',
        {
            v2005: MultisigMultisigApprovalEvent,
            v9130: MultisigMultisigApprovalEvent,
        }
    ),
    MultisigCancelled: createEvent(
        'Multisig.MultisigCancelled',
        {
            v2005: MultisigMultisigCancelledEvent,
            v9130: MultisigMultisigCancelledEvent,
        }
    ),
    MultisigExecuted: createEvent(
        'Multisig.MultisigExecuted',
        {
            v2005: MultisigMultisigExecutedEvent,
            v9111: MultisigMultisigExecutedEvent,
            v9130: MultisigMultisigExecutedEvent,
            v9160: MultisigMultisigExecutedEvent,
            v9170: MultisigMultisigExecutedEvent,
            v9190: MultisigMultisigExecutedEvent,
            v9320: MultisigMultisigExecutedEvent,
            v9420: MultisigMultisigExecutedEvent,
            v9430: MultisigMultisigExecutedEvent,
        }
    ),
    NewMultisig: createEvent(
        'Multisig.NewMultisig',
        {
            v2005: MultisigNewMultisigEvent,
            v9130: MultisigNewMultisigEvent,
        }
    ),
    Uncallable: createEvent(
        'Multisig.Uncallable',
        {
            v2005: MultisigUncallableEvent,
        }
    ),
}

export const calls = {
    approve_as_multi: createCall(
        'Multisig.approve_as_multi',
        {
            v2005: MultisigApproveAsMultiCall,
            v2011: MultisigApproveAsMultiCall,
            v9111: MultisigApproveAsMultiCall,
            v9291: MultisigApproveAsMultiCall,
            v9320: MultisigApproveAsMultiCall,
        }
    ),
    as_multi: createCall(
        'Multisig.as_multi',
        {
            v2005: MultisigAsMultiCall,
            v2007: MultisigAsMultiCall,
            v2011: MultisigAsMultiCall,
            v9111: MultisigAsMultiCall,
            v9291: MultisigAsMultiCall,
            v9320: MultisigAsMultiCall,
            v9340: MultisigAsMultiCall,
            v9350: MultisigAsMultiCall,
            v9370: MultisigAsMultiCall,
            v9381: MultisigAsMultiCall,
            v9420: MultisigAsMultiCall,
            v9430: MultisigAsMultiCall,
        }
    ),
    as_multi_threshold_1: createCall(
        'Multisig.as_multi_threshold_1',
        {
            v2011: MultisigAsMultiThreshold1Call,
            v2013: MultisigAsMultiThreshold1Call,
            v2015: MultisigAsMultiThreshold1Call,
            v2022: MultisigAsMultiThreshold1Call,
            v2023: MultisigAsMultiThreshold1Call,
            v2024: MultisigAsMultiThreshold1Call,
            v2025: MultisigAsMultiThreshold1Call,
            v2026: MultisigAsMultiThreshold1Call,
            v2028: MultisigAsMultiThreshold1Call,
            v2029: MultisigAsMultiThreshold1Call,
            v2030: MultisigAsMultiThreshold1Call,
            v9010: MultisigAsMultiThreshold1Call,
            v9030: MultisigAsMultiThreshold1Call,
            v9040: MultisigAsMultiThreshold1Call,
            v9050: MultisigAsMultiThreshold1Call,
            v9080: MultisigAsMultiThreshold1Call,
            v9090: MultisigAsMultiThreshold1Call,
            v9100: MultisigAsMultiThreshold1Call,
            v9111: MultisigAsMultiThreshold1Call,
            v9122: MultisigAsMultiThreshold1Call,
            v9130: MultisigAsMultiThreshold1Call,
            v9160: MultisigAsMultiThreshold1Call,
            v9170: MultisigAsMultiThreshold1Call,
            v9180: MultisigAsMultiThreshold1Call,
            v9190: MultisigAsMultiThreshold1Call,
            v9220: MultisigAsMultiThreshold1Call,
            v9230: MultisigAsMultiThreshold1Call,
            v9250: MultisigAsMultiThreshold1Call,
            v9271: MultisigAsMultiThreshold1Call,
            v9291: MultisigAsMultiThreshold1Call,
            v9300: MultisigAsMultiThreshold1Call,
            v9320: MultisigAsMultiThreshold1Call,
            v9340: MultisigAsMultiThreshold1Call,
            v9350: MultisigAsMultiThreshold1Call,
            v9370: MultisigAsMultiThreshold1Call,
            v9381: MultisigAsMultiThreshold1Call,
            v9420: MultisigAsMultiThreshold1Call,
            v9430: MultisigAsMultiThreshold1Call,
        }
    ),
    cancel_as_multi: createCall(
        'Multisig.cancel_as_multi',
        {
            v2005: MultisigCancelAsMultiCall,
            v9111: MultisigCancelAsMultiCall,
        }
    ),
}

export const constants = {
    DepositBase: createConstant(
        'Multisig.DepositBase',
        {
            v2024: MultisigDepositBaseConstant,
        }
    ),
    DepositFactor: createConstant(
        'Multisig.DepositFactor',
        {
            v2024: MultisigDepositFactorConstant,
        }
    ),
    MaxSignatories: createConstant(
        'Multisig.MaxSignatories',
        {
            v2024: MultisigMaxSignatoriesConstant,
        }
    ),
}

export const storage = {
    Calls: createStorage(
        'Multisig.Calls',
        {
            v2011: MultisigCallsStorage,
        }
    ),
    Multisigs: createStorage(
        'Multisig.Multisigs',
        {
            v2005: MultisigMultisigsStorage,
        }
    ),
}

export default {events, calls, constants}
