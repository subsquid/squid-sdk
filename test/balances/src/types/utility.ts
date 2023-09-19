import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    BatchCompleted: createEvent(
        'Utility.BatchCompleted',
        {
            v1032: UtilityBatchCompletedEvent,
        }
    ),
    BatchCompletedWithErrors: createEvent(
        'Utility.BatchCompletedWithErrors',
        {
            v9220: UtilityBatchCompletedWithErrorsEvent,
        }
    ),
    BatchInterrupted: createEvent(
        'Utility.BatchInterrupted',
        {
            v1032: UtilityBatchInterruptedEvent,
            v9111: UtilityBatchInterruptedEvent,
            v9130: UtilityBatchInterruptedEvent,
            v9160: UtilityBatchInterruptedEvent,
            v9170: UtilityBatchInterruptedEvent,
            v9190: UtilityBatchInterruptedEvent,
            v9320: UtilityBatchInterruptedEvent,
            v9420: UtilityBatchInterruptedEvent,
            v9430: UtilityBatchInterruptedEvent,
        }
    ),
    DispatchedAs: createEvent(
        'Utility.DispatchedAs',
        {
            v9130: UtilityDispatchedAsEvent,
            v9160: UtilityDispatchedAsEvent,
            v9170: UtilityDispatchedAsEvent,
            v9190: UtilityDispatchedAsEvent,
            v9320: UtilityDispatchedAsEvent,
            v9420: UtilityDispatchedAsEvent,
            v9430: UtilityDispatchedAsEvent,
        }
    ),
    ItemCompleted: createEvent(
        'Utility.ItemCompleted',
        {
            v9090: UtilityItemCompletedEvent,
        }
    ),
    ItemFailed: createEvent(
        'Utility.ItemFailed',
        {
            v9220: UtilityItemFailedEvent,
            v9320: UtilityItemFailedEvent,
            v9420: UtilityItemFailedEvent,
            v9430: UtilityItemFailedEvent,
        }
    ),
    MultisigApproval: createEvent(
        'Utility.MultisigApproval',
        {
            v1032: UtilityMultisigApprovalEvent,
            v1058: UtilityMultisigApprovalEvent,
        }
    ),
    MultisigCancelled: createEvent(
        'Utility.MultisigCancelled',
        {
            v1032: UtilityMultisigCancelledEvent,
            v1058: UtilityMultisigCancelledEvent,
        }
    ),
    MultisigExecuted: createEvent(
        'Utility.MultisigExecuted',
        {
            v1032: UtilityMultisigExecutedEvent,
            v1058: UtilityMultisigExecutedEvent,
        }
    ),
    NewMultisig: createEvent(
        'Utility.NewMultisig',
        {
            v1032: UtilityNewMultisigEvent,
            v1058: UtilityNewMultisigEvent,
        }
    ),
    Uncallable: createEvent(
        'Utility.Uncallable',
        {
            v2005: UtilityUncallableEvent,
        }
    ),
}

export const calls = {
    approve_as_multi: createCall(
        'Utility.approve_as_multi',
        {
            v1032: UtilityApproveAsMultiCall,
        }
    ),
    as_derivative: createCall(
        'Utility.as_derivative',
        {
            v2013: UtilityAsDerivativeCall,
            v2015: UtilityAsDerivativeCall,
            v2022: UtilityAsDerivativeCall,
            v2023: UtilityAsDerivativeCall,
            v2024: UtilityAsDerivativeCall,
            v2025: UtilityAsDerivativeCall,
            v2026: UtilityAsDerivativeCall,
            v2028: UtilityAsDerivativeCall,
            v2029: UtilityAsDerivativeCall,
            v2030: UtilityAsDerivativeCall,
            v9010: UtilityAsDerivativeCall,
            v9030: UtilityAsDerivativeCall,
            v9040: UtilityAsDerivativeCall,
            v9050: UtilityAsDerivativeCall,
            v9080: UtilityAsDerivativeCall,
            v9090: UtilityAsDerivativeCall,
            v9100: UtilityAsDerivativeCall,
            v9111: UtilityAsDerivativeCall,
            v9122: UtilityAsDerivativeCall,
            v9130: UtilityAsDerivativeCall,
            v9160: UtilityAsDerivativeCall,
            v9170: UtilityAsDerivativeCall,
            v9180: UtilityAsDerivativeCall,
            v9190: UtilityAsDerivativeCall,
            v9220: UtilityAsDerivativeCall,
            v9230: UtilityAsDerivativeCall,
            v9250: UtilityAsDerivativeCall,
            v9271: UtilityAsDerivativeCall,
            v9291: UtilityAsDerivativeCall,
            v9300: UtilityAsDerivativeCall,
            v9320: UtilityAsDerivativeCall,
            v9340: UtilityAsDerivativeCall,
            v9350: UtilityAsDerivativeCall,
            v9370: UtilityAsDerivativeCall,
            v9381: UtilityAsDerivativeCall,
            v9420: UtilityAsDerivativeCall,
            v9430: UtilityAsDerivativeCall,
        }
    ),
    as_limited_sub: createCall(
        'Utility.as_limited_sub',
        {
            v2005: UtilityAsLimitedSubCall,
            v2007: UtilityAsLimitedSubCall,
            v2011: UtilityAsLimitedSubCall,
        }
    ),
    as_multi: createCall(
        'Utility.as_multi',
        {
            v1032: UtilityAsMultiCall,
            v1038: UtilityAsMultiCall,
            v1040: UtilityAsMultiCall,
            v1042: UtilityAsMultiCall,
            v1050: UtilityAsMultiCall,
            v1054: UtilityAsMultiCall,
            v1055: UtilityAsMultiCall,
            v1058: UtilityAsMultiCall,
            v1062: UtilityAsMultiCall,
        }
    ),
    as_sub: createCall(
        'Utility.as_sub',
        {
            v1032: UtilityAsSubCall,
            v1038: UtilityAsSubCall,
            v1040: UtilityAsSubCall,
            v1042: UtilityAsSubCall,
            v1050: UtilityAsSubCall,
            v1054: UtilityAsSubCall,
            v1055: UtilityAsSubCall,
            v1058: UtilityAsSubCall,
            v1062: UtilityAsSubCall,
            v2005: UtilityAsSubCall,
            v2007: UtilityAsSubCall,
            v2011: UtilityAsSubCall,
        }
    ),
    batch: createCall(
        'Utility.batch',
        {
            v1032: UtilityBatchCall,
            v1038: UtilityBatchCall,
            v1040: UtilityBatchCall,
            v1042: UtilityBatchCall,
            v1050: UtilityBatchCall,
            v1054: UtilityBatchCall,
            v1055: UtilityBatchCall,
            v1058: UtilityBatchCall,
            v1062: UtilityBatchCall,
            v2005: UtilityBatchCall,
            v2007: UtilityBatchCall,
            v2011: UtilityBatchCall,
            v2013: UtilityBatchCall,
            v2015: UtilityBatchCall,
            v2022: UtilityBatchCall,
            v2023: UtilityBatchCall,
            v2024: UtilityBatchCall,
            v2025: UtilityBatchCall,
            v2026: UtilityBatchCall,
            v2028: UtilityBatchCall,
            v2029: UtilityBatchCall,
            v2030: UtilityBatchCall,
            v9010: UtilityBatchCall,
            v9030: UtilityBatchCall,
            v9040: UtilityBatchCall,
            v9050: UtilityBatchCall,
            v9080: UtilityBatchCall,
            v9090: UtilityBatchCall,
            v9100: UtilityBatchCall,
            v9111: UtilityBatchCall,
            v9122: UtilityBatchCall,
            v9130: UtilityBatchCall,
            v9160: UtilityBatchCall,
            v9170: UtilityBatchCall,
            v9180: UtilityBatchCall,
            v9190: UtilityBatchCall,
            v9220: UtilityBatchCall,
            v9230: UtilityBatchCall,
            v9250: UtilityBatchCall,
            v9271: UtilityBatchCall,
            v9291: UtilityBatchCall,
            v9300: UtilityBatchCall,
            v9320: UtilityBatchCall,
            v9340: UtilityBatchCall,
            v9350: UtilityBatchCall,
            v9370: UtilityBatchCall,
            v9381: UtilityBatchCall,
            v9420: UtilityBatchCall,
            v9430: UtilityBatchCall,
        }
    ),
    batch_all: createCall(
        'Utility.batch_all',
        {
            v2026: UtilityBatchAllCall,
            v2028: UtilityBatchAllCall,
            v2029: UtilityBatchAllCall,
            v2030: UtilityBatchAllCall,
            v9010: UtilityBatchAllCall,
            v9030: UtilityBatchAllCall,
            v9040: UtilityBatchAllCall,
            v9050: UtilityBatchAllCall,
            v9080: UtilityBatchAllCall,
            v9090: UtilityBatchAllCall,
            v9100: UtilityBatchAllCall,
            v9111: UtilityBatchAllCall,
            v9122: UtilityBatchAllCall,
            v9130: UtilityBatchAllCall,
            v9160: UtilityBatchAllCall,
            v9170: UtilityBatchAllCall,
            v9180: UtilityBatchAllCall,
            v9190: UtilityBatchAllCall,
            v9220: UtilityBatchAllCall,
            v9230: UtilityBatchAllCall,
            v9250: UtilityBatchAllCall,
            v9271: UtilityBatchAllCall,
            v9291: UtilityBatchAllCall,
            v9300: UtilityBatchAllCall,
            v9320: UtilityBatchAllCall,
            v9340: UtilityBatchAllCall,
            v9350: UtilityBatchAllCall,
            v9370: UtilityBatchAllCall,
            v9381: UtilityBatchAllCall,
            v9420: UtilityBatchAllCall,
            v9430: UtilityBatchAllCall,
        }
    ),
    cancel_as_multi: createCall(
        'Utility.cancel_as_multi',
        {
            v1032: UtilityCancelAsMultiCall,
        }
    ),
    dispatch_as: createCall(
        'Utility.dispatch_as',
        {
            v9130: UtilityDispatchAsCall,
            v9160: UtilityDispatchAsCall,
            v9170: UtilityDispatchAsCall,
            v9180: UtilityDispatchAsCall,
            v9190: UtilityDispatchAsCall,
            v9220: UtilityDispatchAsCall,
            v9230: UtilityDispatchAsCall,
            v9250: UtilityDispatchAsCall,
            v9271: UtilityDispatchAsCall,
            v9291: UtilityDispatchAsCall,
            v9300: UtilityDispatchAsCall,
            v9320: UtilityDispatchAsCall,
            v9340: UtilityDispatchAsCall,
            v9350: UtilityDispatchAsCall,
            v9370: UtilityDispatchAsCall,
            v9381: UtilityDispatchAsCall,
            v9420: UtilityDispatchAsCall,
            v9430: UtilityDispatchAsCall,
        }
    ),
    force_batch: createCall(
        'Utility.force_batch',
        {
            v9220: UtilityForceBatchCall,
            v9230: UtilityForceBatchCall,
            v9250: UtilityForceBatchCall,
            v9271: UtilityForceBatchCall,
            v9291: UtilityForceBatchCall,
            v9300: UtilityForceBatchCall,
            v9320: UtilityForceBatchCall,
            v9340: UtilityForceBatchCall,
            v9350: UtilityForceBatchCall,
            v9370: UtilityForceBatchCall,
            v9381: UtilityForceBatchCall,
            v9420: UtilityForceBatchCall,
            v9430: UtilityForceBatchCall,
        }
    ),
    with_weight: createCall(
        'Utility.with_weight',
        {
            v9340: UtilityWithWeightCall,
            v9350: UtilityWithWeightCall,
            v9370: UtilityWithWeightCall,
            v9381: UtilityWithWeightCall,
            v9420: UtilityWithWeightCall,
            v9430: UtilityWithWeightCall,
        }
    ),
}

export const constants = {
    batched_calls_limit: createConstant(
        'Utility.batched_calls_limit',
        {
            v9090: UtilityBatchedCallsLimitConstant,
        }
    ),
}

export const storage = {
    Multisigs: createStorage(
        'Utility.Multisigs',
        {
            v1032: UtilityMultisigsStorage,
        }
    ),
}

export default {events, calls, constants}
