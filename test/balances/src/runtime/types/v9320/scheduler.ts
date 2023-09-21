import {sts} from '../../pallet.support'
import {Call, Type_60} from './types'

/**
 * Schedule a named task after a delay.
 * 
 * # <weight>
 * Same as [`schedule_named`](Self::schedule_named).
 * # </weight>
 */
export type SchedulerScheduleNamedAfterCall = {
    id: Bytes,
    after: number,
    maybePeriodic?: ([number, number] | undefined),
    priority: number,
    call: Call,
}

export const SchedulerScheduleNamedAfterCall: sts.Type<SchedulerScheduleNamedAfterCall> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        after: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: Call,
    }
})

/**
 * Schedule a named task.
 */
export type SchedulerScheduleNamedCall = {
    id: Bytes,
    when: number,
    maybePeriodic?: ([number, number] | undefined),
    priority: number,
    call: Call,
}

export const SchedulerScheduleNamedCall: sts.Type<SchedulerScheduleNamedCall> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        when: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: Call,
    }
})

/**
 * Anonymously schedule a task after a delay.
 * 
 * # <weight>
 * Same as [`schedule`].
 * # </weight>
 */
export type SchedulerScheduleAfterCall = {
    after: number,
    maybePeriodic?: ([number, number] | undefined),
    priority: number,
    call: Call,
}

export const SchedulerScheduleAfterCall: sts.Type<SchedulerScheduleAfterCall> = sts.struct(() => {
    return  {
        after: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: Call,
    }
})

/**
 * Anonymously schedule a task.
 */
export type SchedulerScheduleCall = {
    when: number,
    maybePeriodic?: ([number, number] | undefined),
    priority: number,
    call: Call,
}

export const SchedulerScheduleCall: sts.Type<SchedulerScheduleCall> = sts.struct(() => {
    return  {
        when: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: Call,
    }
})

/**
 * The given task can never be executed since it is overweight.
 */
export type SchedulerPermanentlyOverweightEvent = {
    task: [number, number],
    id?: (Bytes | undefined),
}

export const SchedulerPermanentlyOverweightEvent: sts.Type<SchedulerPermanentlyOverweightEvent> = sts.struct(() => {
    return  {
        task: sts.tuple(() => sts.number(), sts.number()),
        id: sts.option(() => sts.bytes()),
    }
})

/**
 * The given task was unable to be renewed since the agenda is full at that block.
 */
export type SchedulerPeriodicFailedEvent = {
    task: [number, number],
    id?: (Bytes | undefined),
}

export const SchedulerPeriodicFailedEvent: sts.Type<SchedulerPeriodicFailedEvent> = sts.struct(() => {
    return  {
        task: sts.tuple(() => sts.number(), sts.number()),
        id: sts.option(() => sts.bytes()),
    }
})

/**
 * Dispatched some task.
 */
export type SchedulerDispatchedEvent = {
    task: [number, number],
    id?: (Bytes | undefined),
    result: Type_60,
}

export const SchedulerDispatchedEvent: sts.Type<SchedulerDispatchedEvent> = sts.struct(() => {
    return  {
        task: sts.tuple(() => sts.number(), sts.number()),
        id: sts.option(() => sts.bytes()),
        result: Type_60,
    }
})

/**
 * The call for the provided hash was not found so the task has been aborted.
 */
export type SchedulerCallUnavailableEvent = {
    task: [number, number],
    id?: (Bytes | undefined),
}

export const SchedulerCallUnavailableEvent: sts.Type<SchedulerCallUnavailableEvent> = sts.struct(() => {
    return  {
        task: sts.tuple(() => sts.number(), sts.number()),
        id: sts.option(() => sts.bytes()),
    }
})
