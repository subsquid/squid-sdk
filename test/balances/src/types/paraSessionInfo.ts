import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const storage = {
    AccountKeys: createStorage(
        'ParaSessionInfo.AccountKeys',
        {
            v9230: ParaSessionInfoAccountKeysStorage,
        }
    ),
    AssignmentKeysUnsafe: createStorage(
        'ParaSessionInfo.AssignmentKeysUnsafe',
        {
            v9090: ParaSessionInfoAssignmentKeysUnsafeStorage,
        }
    ),
    EarliestStoredSession: createStorage(
        'ParaSessionInfo.EarliestStoredSession',
        {
            v9090: ParaSessionInfoEarliestStoredSessionStorage,
        }
    ),
    SessionExecutorParams: createStorage(
        'ParaSessionInfo.SessionExecutorParams',
        {
            v9420: ParaSessionInfoSessionExecutorParamsStorage,
        }
    ),
    Sessions: createStorage(
        'ParaSessionInfo.Sessions',
        {
            v9090: ParaSessionInfoSessionsStorage,
            v9160: ParaSessionInfoSessionsStorage,
        }
    ),
}

export default {}
