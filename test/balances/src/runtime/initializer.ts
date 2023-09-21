import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'

export const calls = {
    force_approve: createCall(
        'Initializer.force_approve',
        {
            v9090: v9090.InitializerForceApproveCall,
            v9111: v9111.InitializerForceApproveCall,
        }
    ),
}

export const storage = {
    BufferedSessionChanges: createStorage(
        'Initializer.BufferedSessionChanges',
        {
            v9090: v9090.InitializerBufferedSessionChangesStorage,
            v9111: v9111.InitializerBufferedSessionChangesStorage,
        }
    ),
    HasInitialized: createStorage(
        'Initializer.HasInitialized',
        {
            v9090: v9090.InitializerHasInitializedStorage,
        }
    ),
}

export default {calls}
