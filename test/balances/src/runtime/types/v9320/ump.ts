import {sts} from '../../pallet.support'
import {Weight, Id} from './types'

/**
 * Service a single overweight upward message.
 * 
 * - `origin`: Must pass `ExecuteOverweightOrigin`.
 * - `index`: The index of the overweight message to service.
 * - `weight_limit`: The amount of weight that message execution may take.
 * 
 * Errors:
 * - `UnknownMessageIndex`: Message of `index` is unknown.
 * - `WeightOverLimit`: Message execution may use greater than `weight_limit`.
 * 
 * Events:
 * - `OverweightServiced`: On success.
 */
export type UmpServiceOverweightCall = {
    index: bigint,
    weightLimit: Weight,
}

export const UmpServiceOverweightCall: sts.Type<UmpServiceOverweightCall> = sts.struct(() => {
    return  {
        index: sts.bigint(),
        weightLimit: Weight,
    }
})

/**
 * The weight limit for handling upward messages was reached.
 * \[ id, remaining, required \]
 */
export type UmpWeightExhaustedEvent = [Bytes, Weight, Weight]

export const UmpWeightExhaustedEvent: sts.Type<UmpWeightExhaustedEvent> = sts.tuple(() => sts.bytes(), Weight, Weight)

/**
 * Upward message from the overweight queue was executed with the given actual weight
 * used.
 * 
 * \[ overweight_index, used \]
 */
export type UmpOverweightServicedEvent = [bigint, Weight]

export const UmpOverweightServicedEvent: sts.Type<UmpOverweightServicedEvent> = sts.tuple(() => sts.bigint(), Weight)

/**
 * The weight budget was exceeded for an individual upward message.
 * 
 * This message can be later dispatched manually using `service_overweight` dispatchable
 * using the assigned `overweight_index`.
 * 
 * \[ para, id, overweight_index, required \]
 */
export type UmpOverweightEnqueuedEvent = [Id, Bytes, bigint, Weight]

export const UmpOverweightEnqueuedEvent: sts.Type<UmpOverweightEnqueuedEvent> = sts.tuple(() => Id, sts.bytes(), sts.bigint(), Weight)
