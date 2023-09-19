import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    ExecutedUpward: createEvent(
        'Ump.ExecutedUpward',
        {
            v9090: UmpExecutedUpwardEvent,
            v9100: UmpExecutedUpwardEvent,
            v9111: UmpExecutedUpwardEvent,
            v9160: UmpExecutedUpwardEvent,
            v9381: UmpExecutedUpwardEvent,
        }
    ),
    InvalidFormat: createEvent(
        'Ump.InvalidFormat',
        {
            v9090: UmpInvalidFormatEvent,
        }
    ),
    OverweightEnqueued: createEvent(
        'Ump.OverweightEnqueued',
        {
            v9100: UmpOverweightEnqueuedEvent,
            v9291: UmpOverweightEnqueuedEvent,
            v9320: UmpOverweightEnqueuedEvent,
        }
    ),
    OverweightServiced: createEvent(
        'Ump.OverweightServiced',
        {
            v9100: UmpOverweightServicedEvent,
            v9291: UmpOverweightServicedEvent,
            v9320: UmpOverweightServicedEvent,
        }
    ),
    UnsupportedVersion: createEvent(
        'Ump.UnsupportedVersion',
        {
            v9090: UmpUnsupportedVersionEvent,
        }
    ),
    UpwardMessagesReceived: createEvent(
        'Ump.UpwardMessagesReceived',
        {
            v9090: UmpUpwardMessagesReceivedEvent,
        }
    ),
    WeightExhausted: createEvent(
        'Ump.WeightExhausted',
        {
            v9090: UmpWeightExhaustedEvent,
            v9291: UmpWeightExhaustedEvent,
            v9320: UmpWeightExhaustedEvent,
        }
    ),
}

export const calls = {
    service_overweight: createCall(
        'Ump.service_overweight',
        {
            v9100: UmpServiceOverweightCall,
            v9111: UmpServiceOverweightCall,
            v9291: UmpServiceOverweightCall,
            v9320: UmpServiceOverweightCall,
        }
    ),
}

export const storage = {
    CounterForOverweight: createStorage(
        'Ump.CounterForOverweight',
        {
            v9381: UmpCounterForOverweightStorage,
        }
    ),
    NeedsDispatch: createStorage(
        'Ump.NeedsDispatch',
        {
            v9090: UmpNeedsDispatchStorage,
        }
    ),
    NextDispatchRoundStartWith: createStorage(
        'Ump.NextDispatchRoundStartWith',
        {
            v9090: UmpNextDispatchRoundStartWithStorage,
        }
    ),
    Overweight: createStorage(
        'Ump.Overweight',
        {
            v9100: UmpOverweightStorage,
        }
    ),
    OverweightCount: createStorage(
        'Ump.OverweightCount',
        {
            v9100: UmpOverweightCountStorage,
        }
    ),
    RelayDispatchQueueSize: createStorage(
        'Ump.RelayDispatchQueueSize',
        {
            v9090: UmpRelayDispatchQueueSizeStorage,
        }
    ),
    RelayDispatchQueues: createStorage(
        'Ump.RelayDispatchQueues',
        {
            v9090: UmpRelayDispatchQueuesStorage,
        }
    ),
}

export default {events, calls}
