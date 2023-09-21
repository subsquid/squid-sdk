import {sts} from '../../pallet.support'
import {BlockNumber, TaskAddress, DispatchResult} from './types'

export type SchedulerScheduledEvent = [BlockNumber]

export const SchedulerScheduledEvent: sts.Type<SchedulerScheduledEvent> = sts.tuple(() => BlockNumber)

export type SchedulerDispatchedEvent = [TaskAddress, (Bytes | undefined), DispatchResult]

export const SchedulerDispatchedEvent: sts.Type<SchedulerDispatchedEvent> = sts.tuple(() => TaskAddress, sts.option(() => sts.bytes()), DispatchResult)
