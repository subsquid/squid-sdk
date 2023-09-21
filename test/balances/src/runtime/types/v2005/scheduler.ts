import {sts} from '../../pallet.support'
import {BlockNumber, Period, Priority, Type_188} from './types'

/**
 *  Schedule a named task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 29.6 + .159 * S µs
 *  - DB Weight:
 *      - Read: Agenda, Lookup
 *      - Write: Agenda, Lookup
 *  - Will use base weight of 35 which should be good for more than 30 scheduled calls
 *  # </weight>
 */
export type SchedulerScheduleNamedCall = {
    id: Bytes,
    when: BlockNumber,
    maybe_periodic?: (Period | undefined),
    priority: Priority,
    call: Type_188,
}

export const SchedulerScheduleNamedCall: sts.Type<SchedulerScheduleNamedCall> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        when: BlockNumber,
        maybe_periodic: sts.option(() => Period),
        priority: Priority,
        call: Type_188,
    }
})

/**
 *  Anonymously schedule a task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 22.29 + .126 * S µs
 *  - DB Weight:
 *      - Read: Agenda
 *      - Write: Agenda
 *  - Will use base weight of 25 which should be good for up to 30 scheduled calls
 *  # </weight>
 */
export type SchedulerScheduleCall = {
    when: BlockNumber,
    maybe_periodic?: (Period | undefined),
    priority: Priority,
    call: Type_188,
}

export const SchedulerScheduleCall: sts.Type<SchedulerScheduleCall> = sts.struct(() => {
    return  {
        when: BlockNumber,
        maybe_periodic: sts.option(() => Period),
        priority: Priority,
        call: Type_188,
    }
})

/**
 *  Cancel a named scheduled task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 24.91 + 2.907 * S µs
 *  - DB Weight:
 *      - Read: Agenda, Lookup
 *      - Write: Agenda, Lookup
 *  - Will use base weight of 100 which should be good for up to 30 scheduled calls
 *  # </weight>
 */
export type SchedulerCancelNamedCall = {
    id: Bytes,
}

export const SchedulerCancelNamedCall: sts.Type<SchedulerCancelNamedCall> = sts.struct(() => {
    return  {
        id: sts.bytes(),
    }
})

/**
 *  Cancel an anonymously scheduled task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 22.15 + 2.869 * S µs
 *  - DB Weight:
 *      - Read: Agenda
 *      - Write: Agenda, Lookup
 *  - Will use base weight of 100 which should be good for up to 30 scheduled calls
 *  # </weight>
 */
export type SchedulerCancelCall = {
    when: BlockNumber,
    index: number,
}

export const SchedulerCancelCall: sts.Type<SchedulerCancelCall> = sts.struct(() => {
    return  {
        when: BlockNumber,
        index: sts.number(),
    }
})

export type SchedulerScheduledEvent = [BlockNumber, number]

export const SchedulerScheduledEvent: sts.Type<SchedulerScheduledEvent> = sts.tuple(() => BlockNumber, sts.number())

export type SchedulerCanceledEvent = [BlockNumber, number]

export const SchedulerCanceledEvent: sts.Type<SchedulerCanceledEvent> = sts.tuple(() => BlockNumber, sts.number())
