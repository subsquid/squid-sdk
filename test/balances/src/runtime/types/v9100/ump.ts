import {sts} from '../../pallet.support'
import {OverweightIndex, Weight, ParaId, MessageId, Outcome} from './types'

/**
 *  Service a single overweight upward message.
 * 
 *  - `origin`: Must pass `ExecuteOverweightOrigin`.
 *  - `index`: The index of the overweight message to service.
 *  - `weight_limit`: The amount of weight that message execution may take.
 * 
 *  Errors:
 *  - `UnknownMessageIndex`: Message of `index` is unknown.
 *  - `WeightOverLimit`: Message execution may use greater than `weight_limit`.
 * 
 *  Events:
 *  - `OverweightServiced`: On success.
 */
export type UmpServiceOverweightCall = {
    index: OverweightIndex,
    weight_limit: Weight,
}

export const UmpServiceOverweightCall: sts.Type<UmpServiceOverweightCall> = sts.struct(() => {
    return  {
        index: OverweightIndex,
        weight_limit: Weight,
    }
})

/**
 *  Downward message from the overweight queue was executed with the given actual weight
 *  used.
 * 
 *  \[ overweight_index, used \]
 */
export type UmpOverweightServicedEvent = [OverweightIndex, Weight]

export const UmpOverweightServicedEvent: sts.Type<UmpOverweightServicedEvent> = sts.tuple(() => OverweightIndex, Weight)

/**
 *  The weight budget was exceeded for an individual downward message.
 * 
 *  This message can be later dispatched manually using `service_overweight` dispatchable
 *  using the assigned `overweight_index`.
 * 
 *  \[ para, id, overweight_index, required \]
 */
export type UmpOverweightEnqueuedEvent = [ParaId, MessageId, OverweightIndex, Weight]

export const UmpOverweightEnqueuedEvent: sts.Type<UmpOverweightEnqueuedEvent> = sts.tuple(() => ParaId, MessageId, OverweightIndex, Weight)

/**
 *  Upward message executed with the given outcome.
 *  \[ id, outcome \]
 */
export type UmpExecutedUpwardEvent = [MessageId, Outcome]

export const UmpExecutedUpwardEvent: sts.Type<UmpExecutedUpwardEvent> = sts.tuple(() => MessageId, Outcome)
