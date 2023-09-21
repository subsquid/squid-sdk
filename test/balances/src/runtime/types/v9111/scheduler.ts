import {sts} from '../../pallet.support'
import {Call, Type_52} from './types'

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
 * 
 * # <weight>
 * - S = Number of already scheduled calls
 * - Base Weight: 29.6 + .159 * S µs
 * - DB Weight:
 *     - Read: Agenda, Lookup
 *     - Write: Agenda, Lookup
 * - Will use base weight of 35 which should be good for more than 30 scheduled calls
 * # </weight>
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
 * 
 * # <weight>
 * - S = Number of already scheduled calls
 * - Base Weight: 22.29 + .126 * S µs
 * - DB Weight:
 *     - Read: Agenda
 *     - Write: Agenda
 * - Will use base weight of 25 which should be good for up to 30 scheduled calls
 * # </weight>
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
 * Dispatched some task. \[task, id, result\]
 */
export type SchedulerDispatchedEvent = [[number, number], (Bytes | undefined), Type_52]

export const SchedulerDispatchedEvent: sts.Type<SchedulerDispatchedEvent> = sts.tuple(() => sts.tuple(() => sts.number(), sts.number()), sts.option(() => sts.bytes()), Type_52)
