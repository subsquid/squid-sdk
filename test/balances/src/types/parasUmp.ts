import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    ExecutedUpward: createEvent(
        'ParasUmp.ExecutedUpward',
        {
            v9040: ParasUmpExecutedUpwardEvent,
        }
    ),
    InvalidFormat: createEvent(
        'ParasUmp.InvalidFormat',
        {
            v9040: ParasUmpInvalidFormatEvent,
        }
    ),
    UnsupportedVersion: createEvent(
        'ParasUmp.UnsupportedVersion',
        {
            v9040: ParasUmpUnsupportedVersionEvent,
        }
    ),
    UpwardMessagesReceived: createEvent(
        'ParasUmp.UpwardMessagesReceived',
        {
            v9040: ParasUmpUpwardMessagesReceivedEvent,
        }
    ),
    WeightExhausted: createEvent(
        'ParasUmp.WeightExhausted',
        {
            v9040: ParasUmpWeightExhaustedEvent,
        }
    ),
}

export const storage = {
    NeedsDispatch: createStorage(
        'ParasUmp.NeedsDispatch',
        {
            v9010: ParasUmpNeedsDispatchStorage,
        }
    ),
    NextDispatchRoundStartWith: createStorage(
        'ParasUmp.NextDispatchRoundStartWith',
        {
            v9010: ParasUmpNextDispatchRoundStartWithStorage,
        }
    ),
    RelayDispatchQueueSize: createStorage(
        'ParasUmp.RelayDispatchQueueSize',
        {
            v9010: ParasUmpRelayDispatchQueueSizeStorage,
        }
    ),
    RelayDispatchQueues: createStorage(
        'ParasUmp.RelayDispatchQueues',
        {
            v9010: ParasUmpRelayDispatchQueuesStorage,
        }
    ),
}

export default {events}
