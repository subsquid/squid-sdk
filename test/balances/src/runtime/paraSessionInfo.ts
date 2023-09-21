import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9420 from './types/v9420'
import * as v9230 from './types/v9230'
import * as v9160 from './types/v9160'
import * as v9090 from './types/v9090'

export const storage = {
    AccountKeys: createStorage(
        'ParaSessionInfo.AccountKeys',
        {
            v9230: v9230.ParaSessionInfoAccountKeysStorage,
        }
    ),
    AssignmentKeysUnsafe: createStorage(
        'ParaSessionInfo.AssignmentKeysUnsafe',
        {
            v9090: v9090.ParaSessionInfoAssignmentKeysUnsafeStorage,
        }
    ),
    EarliestStoredSession: createStorage(
        'ParaSessionInfo.EarliestStoredSession',
        {
            v9090: v9090.ParaSessionInfoEarliestStoredSessionStorage,
        }
    ),
    SessionExecutorParams: createStorage(
        'ParaSessionInfo.SessionExecutorParams',
        {
            v9420: v9420.ParaSessionInfoSessionExecutorParamsStorage,
        }
    ),
    Sessions: createStorage(
        'ParaSessionInfo.Sessions',
        {
            v9090: v9090.ParaSessionInfoSessionsStorage,
            v9160: v9160.ParaSessionInfoSessionsStorage,
        }
    ),
}

export default {}
