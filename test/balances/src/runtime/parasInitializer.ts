import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9010 from './types/v9010'

export const calls = {
    force_approve: createCall(
        'ParasInitializer.force_approve',
        {
            v9010: v9010.ParasInitializerForceApproveCall,
        }
    ),
}

export const storage = {
    BufferedSessionChanges: createStorage(
        'ParasInitializer.BufferedSessionChanges',
        {
            v9010: v9010.ParasInitializerBufferedSessionChangesStorage,
        }
    ),
    HasInitialized: createStorage(
        'ParasInitializer.HasInitialized',
        {
            v9010: v9010.ParasInitializerHasInitializedStorage,
        }
    ),
}

export default {calls}
