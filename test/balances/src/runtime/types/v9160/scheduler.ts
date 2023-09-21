import {sts} from '../../pallet.support'
import {MaybeHashed, Type_49, LookupError} from './types'

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
    call: MaybeHashed,
}

export const SchedulerScheduleNamedAfterCall: sts.Type<SchedulerScheduleNamedAfterCall> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        after: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: MaybeHashed,
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
    call: MaybeHashed,
}

export const SchedulerScheduleNamedCall: sts.Type<SchedulerScheduleNamedCall> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        when: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: MaybeHashed,
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
    call: MaybeHashed,
}

export const SchedulerScheduleAfterCall: sts.Type<SchedulerScheduleAfterCall> = sts.struct(() => {
    return  {
        after: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: MaybeHashed,
    }
})

/**
 * Anonymously schedule a task.
 */
export type SchedulerScheduleCall = {
    when: number,
    maybePeriodic?: ([number, number] | undefined),
    priority: number,
    call: MaybeHashed,
}

export const SchedulerScheduleCall: sts.Type<SchedulerScheduleCall> = sts.struct(() => {
    return  {
        when: sts.number(),
        maybePeriodic: sts.option(() => sts.tuple(() => sts.number(), sts.number())),
        priority: sts.number(),
        call: MaybeHashed,
    }
})

/**
 * Scheduled some task.
 */
export type SchedulerScheduledEvent = {
    when: number,
    index: number,
}

export const SchedulerScheduledEvent: sts.Type<SchedulerScheduledEvent> = sts.struct(() => {
    return  {
        when: sts.number(),
        index: sts.number(),
    }
})

/**
 * Dispatched some task.
 */
export type SchedulerDispatchedEvent = {
    task: [number, number],
    id?: (Bytes | undefined),
    result: Type_49,
}

export const SchedulerDispatchedEvent: sts.Type<SchedulerDispatchedEvent> = sts.struct(() => {
    return  {
        task: sts.tuple(() => sts.number(), sts.number()),
        id: sts.option(() => sts.bytes()),
        result: Type_49,
    }
})

/**
 * Canceled some task.
 */
export type SchedulerCanceledEvent = {
    when: number,
    index: number,
}

export const SchedulerCanceledEvent: sts.Type<SchedulerCanceledEvent> = sts.struct(() => {
    return  {
        when: sts.number(),
        index: sts.number(),
    }
})

/**
 * The call for the provided hash was not found so the task has been aborted.
 */
export type SchedulerCallLookupFailedEvent = {
    task: [number, number],
    id?: (Bytes | undefined),
    error: LookupError,
}

export const SchedulerCallLookupFailedEvent: sts.Type<SchedulerCallLookupFailedEvent> = sts.struct(() => {
    return  {
        task: sts.tuple(() => sts.number(), sts.number()),
        id: sts.option(() => sts.bytes()),
        error: LookupError,
    }
})
