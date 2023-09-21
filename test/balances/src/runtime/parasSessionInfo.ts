import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9010 from './types/v9010'

export const storage = {
    AssignmentKeysUnsafe: createStorage(
        'ParasSessionInfo.AssignmentKeysUnsafe',
        {
            v9010: v9010.ParasSessionInfoAssignmentKeysUnsafeStorage,
        }
    ),
    EarliestStoredSession: createStorage(
        'ParasSessionInfo.EarliestStoredSession',
        {
            v9010: v9010.ParasSessionInfoEarliestStoredSessionStorage,
        }
    ),
    Sessions: createStorage(
        'ParasSessionInfo.Sessions',
        {
            v9010: v9010.ParasSessionInfoSessionsStorage,
        }
    ),
}

export default {}
