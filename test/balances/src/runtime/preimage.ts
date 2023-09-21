import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9320 from './types/v9320'
import * as v9160 from './types/v9160'

export const events = {
    Cleared: createEvent(
        'Preimage.Cleared',
        {
            v9160: v9160.PreimageClearedEvent,
        }
    ),
    Noted: createEvent(
        'Preimage.Noted',
        {
            v9160: v9160.PreimageNotedEvent,
        }
    ),
    Requested: createEvent(
        'Preimage.Requested',
        {
            v9160: v9160.PreimageRequestedEvent,
        }
    ),
}

export const calls = {
    note_preimage: createCall(
        'Preimage.note_preimage',
        {
            v9160: v9160.PreimageNotePreimageCall,
        }
    ),
    request_preimage: createCall(
        'Preimage.request_preimage',
        {
            v9160: v9160.PreimageRequestPreimageCall,
        }
    ),
    unnote_preimage: createCall(
        'Preimage.unnote_preimage',
        {
            v9160: v9160.PreimageUnnotePreimageCall,
        }
    ),
    unrequest_preimage: createCall(
        'Preimage.unrequest_preimage',
        {
            v9160: v9160.PreimageUnrequestPreimageCall,
        }
    ),
}

export const storage = {
    PreimageFor: createStorage(
        'Preimage.PreimageFor',
        {
            v9160: v9160.PreimagePreimageForStorage,
            v9320: v9320.PreimagePreimageForStorage,
        }
    ),
    StatusFor: createStorage(
        'Preimage.StatusFor',
        {
            v9160: v9160.PreimageStatusForStorage,
            v9320: v9320.PreimageStatusForStorage,
        }
    ),
}

export default {events, calls}
