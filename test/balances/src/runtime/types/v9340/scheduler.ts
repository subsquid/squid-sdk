import {sts} from '../../pallet.support'
import {Call} from './types'

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
