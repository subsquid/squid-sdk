import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'

export const storage = {
    AvailabilityCores: createStorage(
        'ParaScheduler.AvailabilityCores',
        {
            v9090: v9090.ParaSchedulerAvailabilityCoresStorage,
        }
    ),
    ParathreadClaimIndex: createStorage(
        'ParaScheduler.ParathreadClaimIndex',
        {
            v9090: v9090.ParaSchedulerParathreadClaimIndexStorage,
        }
    ),
    ParathreadQueue: createStorage(
        'ParaScheduler.ParathreadQueue',
        {
            v9090: v9090.ParaSchedulerParathreadQueueStorage,
        }
    ),
    Scheduled: createStorage(
        'ParaScheduler.Scheduled',
        {
            v9090: v9090.ParaSchedulerScheduledStorage,
            v9111: v9111.ParaSchedulerScheduledStorage,
        }
    ),
    SessionStartBlock: createStorage(
        'ParaScheduler.SessionStartBlock',
        {
            v9090: v9090.ParaSchedulerSessionStartBlockStorage,
        }
    ),
    ValidatorGroups: createStorage(
        'ParaScheduler.ValidatorGroups',
        {
            v9090: v9090.ParaSchedulerValidatorGroupsStorage,
        }
    ),
}

export default {}
