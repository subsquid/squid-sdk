import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9130 from './types/v9130'
import * as v9111 from './types/v9111'
import * as v2028 from './types/v2028'
import * as v1051 from './types/v1051'
import * as v1050 from './types/v1050'
import * as v1020 from './types/v1020'

export const events = {
    NewSession: createEvent(
        'Session.NewSession',
        {
            v1020: v1020.SessionNewSessionEvent,
            v9130: v9130.SessionNewSessionEvent,
        }
    ),
}

export const calls = {
    purge_keys: createCall(
        'Session.purge_keys',
        {
            v1050: v1050.SessionPurgeKeysCall,
        }
    ),
    set_keys: createCall(
        'Session.set_keys',
        {
            v1020: v1020.SessionSetKeysCall,
            v2028: v2028.SessionSetKeysCall,
            v9111: v9111.SessionSetKeysCall,
        }
    ),
}

export const constants = {
    DEDUP_KEY_PREFIX: createConstant(
        'Session.DEDUP_KEY_PREFIX',
        {
            v1020: v1020.SessionDedupKeyPrefixConstant,
        }
    ),
}

export const storage = {
    CurrentIndex: createStorage(
        'Session.CurrentIndex',
        {
            v1020: v1020.SessionCurrentIndexStorage,
        }
    ),
    DisabledValidators: createStorage(
        'Session.DisabledValidators',
        {
            v1020: v1020.SessionDisabledValidatorsStorage,
        }
    ),
    KeyOwner: createStorage(
        'Session.KeyOwner',
        {
            v1020: v1020.SessionKeyOwnerStorage,
            v1051: v1051.SessionKeyOwnerStorage,
            v9111: v9111.SessionKeyOwnerStorage,
        }
    ),
    NextKeys: createStorage(
        'Session.NextKeys',
        {
            v1020: v1020.SessionNextKeysStorage,
            v1051: v1051.SessionNextKeysStorage,
            v2028: v2028.SessionNextKeysStorage,
            v9111: v9111.SessionNextKeysStorage,
        }
    ),
    QueuedChanged: createStorage(
        'Session.QueuedChanged',
        {
            v1020: v1020.SessionQueuedChangedStorage,
        }
    ),
    QueuedKeys: createStorage(
        'Session.QueuedKeys',
        {
            v1020: v1020.SessionQueuedKeysStorage,
            v2028: v2028.SessionQueuedKeysStorage,
            v9111: v9111.SessionQueuedKeysStorage,
        }
    ),
    Validators: createStorage(
        'Session.Validators',
        {
            v1020: v1020.SessionValidatorsStorage,
        }
    ),
}

export default {events, calls, constants}
