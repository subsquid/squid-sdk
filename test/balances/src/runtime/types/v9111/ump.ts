import {sts} from '../../pallet.support'
import {V2Outcome} from './types'

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
    weightLimit: bigint,
}

export const UmpServiceOverweightCall: sts.Type<UmpServiceOverweightCall> = sts.struct(() => {
    return  {
        index: sts.bigint(),
        weightLimit: sts.bigint(),
    }
})

/**
 * Upward message executed with the given outcome.
 * \[ id, outcome \]
 */
export type UmpExecutedUpwardEvent = [Bytes, V2Outcome]

export const UmpExecutedUpwardEvent: sts.Type<UmpExecutedUpwardEvent> = sts.tuple(() => sts.bytes(), V2Outcome)
