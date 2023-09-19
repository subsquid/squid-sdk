import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const storage = {
    AssignmentKeysUnsafe: createStorage(
        'ParasSessionInfo.AssignmentKeysUnsafe',
        {
            v9010: ParasSessionInfoAssignmentKeysUnsafeStorage,
        }
    ),
    EarliestStoredSession: createStorage(
        'ParasSessionInfo.EarliestStoredSession',
        {
            v9010: ParasSessionInfoEarliestStoredSessionStorage,
        }
    ),
    Sessions: createStorage(
        'ParasSessionInfo.Sessions',
        {
            v9010: ParasSessionInfoSessionsStorage,
        }
    ),
}

export default {}
