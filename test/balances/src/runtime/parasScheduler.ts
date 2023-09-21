import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9010 from './types/v9010'

export const storage = {
    AvailabilityCores: createStorage(
        'ParasScheduler.AvailabilityCores',
        {
            v9010: v9010.ParasSchedulerAvailabilityCoresStorage,
        }
    ),
    ParathreadClaimIndex: createStorage(
        'ParasScheduler.ParathreadClaimIndex',
        {
            v9010: v9010.ParasSchedulerParathreadClaimIndexStorage,
        }
    ),
    ParathreadQueue: createStorage(
        'ParasScheduler.ParathreadQueue',
        {
            v9010: v9010.ParasSchedulerParathreadQueueStorage,
        }
    ),
    Scheduled: createStorage(
        'ParasScheduler.Scheduled',
        {
            v9010: v9010.ParasSchedulerScheduledStorage,
        }
    ),
    SessionStartBlock: createStorage(
        'ParasScheduler.SessionStartBlock',
        {
            v9010: v9010.ParasSchedulerSessionStartBlockStorage,
        }
    ),
    ValidatorGroups: createStorage(
        'ParasScheduler.ValidatorGroups',
        {
            v9010: v9010.ParasSchedulerValidatorGroupsStorage,
        }
    ),
}

export default {}
