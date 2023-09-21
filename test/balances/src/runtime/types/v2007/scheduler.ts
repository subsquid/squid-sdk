import {sts} from '../../pallet.support'
import {BlockNumber, Period, Priority, Type_189} from './types'

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
    call: Type_189,
}

export const SchedulerScheduleNamedCall: sts.Type<SchedulerScheduleNamedCall> = sts.struct(() => {
    return  {
        id: sts.bytes(),
        when: BlockNumber,
        maybe_periodic: sts.option(() => Period),
        priority: Priority,
        call: Type_189,
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
    call: Type_189,
}

export const SchedulerScheduleCall: sts.Type<SchedulerScheduleCall> = sts.struct(() => {
    return  {
        when: BlockNumber,
        maybe_periodic: sts.option(() => Period),
        priority: Priority,
        call: Type_189,
    }
})
