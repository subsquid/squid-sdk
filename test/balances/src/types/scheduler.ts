import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    CallLookupFailed: createEvent(
        'Scheduler.CallLookupFailed',
        {
            v9160: SchedulerCallLookupFailedEvent,
        }
    ),
    CallUnavailable: createEvent(
        'Scheduler.CallUnavailable',
        {
            v9320: SchedulerCallUnavailableEvent,
        }
    ),
    Canceled: createEvent(
        'Scheduler.Canceled',
        {
            v2005: SchedulerCanceledEvent,
            v9160: SchedulerCanceledEvent,
        }
    ),
    Dispatched: createEvent(
        'Scheduler.Dispatched',
        {
            v1058: SchedulerDispatchedEvent,
            v9111: SchedulerDispatchedEvent,
            v9160: SchedulerDispatchedEvent,
            v9170: SchedulerDispatchedEvent,
            v9190: SchedulerDispatchedEvent,
            v9320: SchedulerDispatchedEvent,
            v9420: SchedulerDispatchedEvent,
            v9430: SchedulerDispatchedEvent,
        }
    ),
    PeriodicFailed: createEvent(
        'Scheduler.PeriodicFailed',
        {
            v9320: SchedulerPeriodicFailedEvent,
        }
    ),
    PermanentlyOverweight: createEvent(
        'Scheduler.PermanentlyOverweight',
        {
            v9320: SchedulerPermanentlyOverweightEvent,
        }
    ),
    Scheduled: createEvent(
        'Scheduler.Scheduled',
        {
            v1058: SchedulerScheduledEvent,
            v2005: SchedulerScheduledEvent,
            v9160: SchedulerScheduledEvent,
        }
    ),
}

export const calls = {
    cancel: createCall(
        'Scheduler.cancel',
        {
            v2005: SchedulerCancelCall,
        }
    ),
    cancel_named: createCall(
        'Scheduler.cancel_named',
        {
            v2005: SchedulerCancelNamedCall,
        }
    ),
    schedule: createCall(
        'Scheduler.schedule',
        {
            v2005: SchedulerScheduleCall,
            v2007: SchedulerScheduleCall,
            v2011: SchedulerScheduleCall,
            v2013: SchedulerScheduleCall,
            v2015: SchedulerScheduleCall,
            v2022: SchedulerScheduleCall,
            v2023: SchedulerScheduleCall,
            v2024: SchedulerScheduleCall,
            v2025: SchedulerScheduleCall,
            v2026: SchedulerScheduleCall,
            v2028: SchedulerScheduleCall,
            v2029: SchedulerScheduleCall,
            v2030: SchedulerScheduleCall,
            v9010: SchedulerScheduleCall,
            v9030: SchedulerScheduleCall,
            v9040: SchedulerScheduleCall,
            v9050: SchedulerScheduleCall,
            v9080: SchedulerScheduleCall,
            v9090: SchedulerScheduleCall,
            v9100: SchedulerScheduleCall,
            v9111: SchedulerScheduleCall,
            v9122: SchedulerScheduleCall,
            v9130: SchedulerScheduleCall,
            v9160: SchedulerScheduleCall,
            v9170: SchedulerScheduleCall,
            v9180: SchedulerScheduleCall,
            v9190: SchedulerScheduleCall,
            v9220: SchedulerScheduleCall,
            v9230: SchedulerScheduleCall,
            v9250: SchedulerScheduleCall,
            v9271: SchedulerScheduleCall,
            v9291: SchedulerScheduleCall,
            v9300: SchedulerScheduleCall,
            v9320: SchedulerScheduleCall,
            v9340: SchedulerScheduleCall,
            v9350: SchedulerScheduleCall,
            v9370: SchedulerScheduleCall,
            v9381: SchedulerScheduleCall,
            v9420: SchedulerScheduleCall,
            v9430: SchedulerScheduleCall,
        }
    ),
    schedule_after: createCall(
        'Scheduler.schedule_after',
        {
            v2015: SchedulerScheduleAfterCall,
            v2022: SchedulerScheduleAfterCall,
            v2023: SchedulerScheduleAfterCall,
            v2024: SchedulerScheduleAfterCall,
            v2025: SchedulerScheduleAfterCall,
            v2026: SchedulerScheduleAfterCall,
            v2028: SchedulerScheduleAfterCall,
            v2029: SchedulerScheduleAfterCall,
            v2030: SchedulerScheduleAfterCall,
            v9010: SchedulerScheduleAfterCall,
            v9030: SchedulerScheduleAfterCall,
            v9040: SchedulerScheduleAfterCall,
            v9050: SchedulerScheduleAfterCall,
            v9080: SchedulerScheduleAfterCall,
            v9090: SchedulerScheduleAfterCall,
            v9100: SchedulerScheduleAfterCall,
            v9111: SchedulerScheduleAfterCall,
            v9122: SchedulerScheduleAfterCall,
            v9130: SchedulerScheduleAfterCall,
            v9160: SchedulerScheduleAfterCall,
            v9170: SchedulerScheduleAfterCall,
            v9180: SchedulerScheduleAfterCall,
            v9190: SchedulerScheduleAfterCall,
            v9220: SchedulerScheduleAfterCall,
            v9230: SchedulerScheduleAfterCall,
            v9250: SchedulerScheduleAfterCall,
            v9271: SchedulerScheduleAfterCall,
            v9291: SchedulerScheduleAfterCall,
            v9300: SchedulerScheduleAfterCall,
            v9320: SchedulerScheduleAfterCall,
            v9340: SchedulerScheduleAfterCall,
            v9350: SchedulerScheduleAfterCall,
            v9370: SchedulerScheduleAfterCall,
            v9381: SchedulerScheduleAfterCall,
            v9420: SchedulerScheduleAfterCall,
            v9430: SchedulerScheduleAfterCall,
        }
    ),
    schedule_named: createCall(
        'Scheduler.schedule_named',
        {
            v2005: SchedulerScheduleNamedCall,
            v2007: SchedulerScheduleNamedCall,
            v2011: SchedulerScheduleNamedCall,
            v2013: SchedulerScheduleNamedCall,
            v2015: SchedulerScheduleNamedCall,
            v2022: SchedulerScheduleNamedCall,
            v2023: SchedulerScheduleNamedCall,
            v2024: SchedulerScheduleNamedCall,
            v2025: SchedulerScheduleNamedCall,
            v2026: SchedulerScheduleNamedCall,
            v2028: SchedulerScheduleNamedCall,
            v2029: SchedulerScheduleNamedCall,
            v2030: SchedulerScheduleNamedCall,
            v9010: SchedulerScheduleNamedCall,
            v9030: SchedulerScheduleNamedCall,
            v9040: SchedulerScheduleNamedCall,
            v9050: SchedulerScheduleNamedCall,
            v9080: SchedulerScheduleNamedCall,
            v9090: SchedulerScheduleNamedCall,
            v9100: SchedulerScheduleNamedCall,
            v9111: SchedulerScheduleNamedCall,
            v9122: SchedulerScheduleNamedCall,
            v9130: SchedulerScheduleNamedCall,
            v9160: SchedulerScheduleNamedCall,
            v9170: SchedulerScheduleNamedCall,
            v9180: SchedulerScheduleNamedCall,
            v9190: SchedulerScheduleNamedCall,
            v9220: SchedulerScheduleNamedCall,
            v9230: SchedulerScheduleNamedCall,
            v9250: SchedulerScheduleNamedCall,
            v9271: SchedulerScheduleNamedCall,
            v9291: SchedulerScheduleNamedCall,
            v9300: SchedulerScheduleNamedCall,
            v9320: SchedulerScheduleNamedCall,
            v9340: SchedulerScheduleNamedCall,
            v9350: SchedulerScheduleNamedCall,
            v9370: SchedulerScheduleNamedCall,
            v9381: SchedulerScheduleNamedCall,
            v9420: SchedulerScheduleNamedCall,
            v9430: SchedulerScheduleNamedCall,
        }
    ),
    schedule_named_after: createCall(
        'Scheduler.schedule_named_after',
        {
            v2015: SchedulerScheduleNamedAfterCall,
            v2022: SchedulerScheduleNamedAfterCall,
            v2023: SchedulerScheduleNamedAfterCall,
            v2024: SchedulerScheduleNamedAfterCall,
            v2025: SchedulerScheduleNamedAfterCall,
            v2026: SchedulerScheduleNamedAfterCall,
            v2028: SchedulerScheduleNamedAfterCall,
            v2029: SchedulerScheduleNamedAfterCall,
            v2030: SchedulerScheduleNamedAfterCall,
            v9010: SchedulerScheduleNamedAfterCall,
            v9030: SchedulerScheduleNamedAfterCall,
            v9040: SchedulerScheduleNamedAfterCall,
            v9050: SchedulerScheduleNamedAfterCall,
            v9080: SchedulerScheduleNamedAfterCall,
            v9090: SchedulerScheduleNamedAfterCall,
            v9100: SchedulerScheduleNamedAfterCall,
            v9111: SchedulerScheduleNamedAfterCall,
            v9122: SchedulerScheduleNamedAfterCall,
            v9130: SchedulerScheduleNamedAfterCall,
            v9160: SchedulerScheduleNamedAfterCall,
            v9170: SchedulerScheduleNamedAfterCall,
            v9180: SchedulerScheduleNamedAfterCall,
            v9190: SchedulerScheduleNamedAfterCall,
            v9220: SchedulerScheduleNamedAfterCall,
            v9230: SchedulerScheduleNamedAfterCall,
            v9250: SchedulerScheduleNamedAfterCall,
            v9271: SchedulerScheduleNamedAfterCall,
            v9291: SchedulerScheduleNamedAfterCall,
            v9300: SchedulerScheduleNamedAfterCall,
            v9320: SchedulerScheduleNamedAfterCall,
            v9340: SchedulerScheduleNamedAfterCall,
            v9350: SchedulerScheduleNamedAfterCall,
            v9370: SchedulerScheduleNamedAfterCall,
            v9381: SchedulerScheduleNamedAfterCall,
            v9420: SchedulerScheduleNamedAfterCall,
            v9430: SchedulerScheduleNamedAfterCall,
        }
    ),
}

export const constants = {
    MaxScheduledPerBlock: createConstant(
        'Scheduler.MaxScheduledPerBlock',
        {
            v9090: SchedulerMaxScheduledPerBlockConstant,
        }
    ),
    MaximumWeight: createConstant(
        'Scheduler.MaximumWeight',
        {
            v9090: SchedulerMaximumWeightConstant,
            v9291: SchedulerMaximumWeightConstant,
            v9320: SchedulerMaximumWeightConstant,
        }
    ),
}

export const storage = {
    Agenda: createStorage(
        'Scheduler.Agenda',
        {
            v1058: SchedulerAgendaStorage,
            v1062: SchedulerAgendaStorage,
            v2005: SchedulerAgendaStorage,
            v2007: SchedulerAgendaStorage,
            v2011: SchedulerAgendaStorage,
            v2013: SchedulerAgendaStorage,
            v2015: SchedulerAgendaStorage,
            v2022: SchedulerAgendaStorage,
            v2023: SchedulerAgendaStorage,
            v2024: SchedulerAgendaStorage,
            v2025: SchedulerAgendaStorage,
            v2026: SchedulerAgendaStorage,
            v2028: SchedulerAgendaStorage,
            v2029: SchedulerAgendaStorage,
            v2030: SchedulerAgendaStorage,
            v9010: SchedulerAgendaStorage,
            v9030: SchedulerAgendaStorage,
            v9040: SchedulerAgendaStorage,
            v9050: SchedulerAgendaStorage,
            v9080: SchedulerAgendaStorage,
            v9090: SchedulerAgendaStorage,
            v9100: SchedulerAgendaStorage,
            v9111: SchedulerAgendaStorage,
            v9122: SchedulerAgendaStorage,
            v9130: SchedulerAgendaStorage,
            v9160: SchedulerAgendaStorage,
            v9170: SchedulerAgendaStorage,
            v9180: SchedulerAgendaStorage,
            v9190: SchedulerAgendaStorage,
            v9220: SchedulerAgendaStorage,
            v9230: SchedulerAgendaStorage,
            v9250: SchedulerAgendaStorage,
            v9271: SchedulerAgendaStorage,
            v9291: SchedulerAgendaStorage,
            v9300: SchedulerAgendaStorage,
            v9320: SchedulerAgendaStorage,
            v9370: SchedulerAgendaStorage,
            v9381: SchedulerAgendaStorage,
            v9420: SchedulerAgendaStorage,
        }
    ),
    IncompleteSince: createStorage(
        'Scheduler.IncompleteSince',
        {
            v9320: SchedulerIncompleteSinceStorage,
        }
    ),
    Lookup: createStorage(
        'Scheduler.Lookup',
        {
            v1058: SchedulerLookupStorage,
        }
    ),
    StorageVersion: createStorage(
        'Scheduler.StorageVersion',
        {
            v2015: SchedulerStorageVersionStorage,
            v9111: SchedulerStorageVersionStorage,
        }
    ),
}

export default {events, calls, constants}
