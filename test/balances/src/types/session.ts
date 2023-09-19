import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    NewSession: createEvent(
        'Session.NewSession',
        {
            v1020: SessionNewSessionEvent,
            v9130: SessionNewSessionEvent,
        }
    ),
}

export const calls = {
    purge_keys: createCall(
        'Session.purge_keys',
        {
            v1050: SessionPurgeKeysCall,
        }
    ),
    set_keys: createCall(
        'Session.set_keys',
        {
            v1020: SessionSetKeysCall,
            v2028: SessionSetKeysCall,
            v9111: SessionSetKeysCall,
        }
    ),
}

export const constants = {
    DEDUP_KEY_PREFIX: createConstant(
        'Session.DEDUP_KEY_PREFIX',
        {
            v1020: SessionDedupKeyPrefixConstant,
        }
    ),
}

export const storage = {
    CurrentIndex: createStorage(
        'Session.CurrentIndex',
        {
            v1020: SessionCurrentIndexStorage,
        }
    ),
    DisabledValidators: createStorage(
        'Session.DisabledValidators',
        {
            v1020: SessionDisabledValidatorsStorage,
        }
    ),
    KeyOwner: createStorage(
        'Session.KeyOwner',
        {
            v1020: SessionKeyOwnerStorage,
            v1051: SessionKeyOwnerStorage,
            v9111: SessionKeyOwnerStorage,
        }
    ),
    NextKeys: createStorage(
        'Session.NextKeys',
        {
            v1020: SessionNextKeysStorage,
            v1051: SessionNextKeysStorage,
            v2028: SessionNextKeysStorage,
            v9111: SessionNextKeysStorage,
        }
    ),
    QueuedChanged: createStorage(
        'Session.QueuedChanged',
        {
            v1020: SessionQueuedChangedStorage,
        }
    ),
    QueuedKeys: createStorage(
        'Session.QueuedKeys',
        {
            v1020: SessionQueuedKeysStorage,
            v2028: SessionQueuedKeysStorage,
            v9111: SessionQueuedKeysStorage,
        }
    ),
    Validators: createStorage(
        'Session.Validators',
        {
            v1020: SessionValidatorsStorage,
        }
    ),
}

export default {events, calls, constants}
