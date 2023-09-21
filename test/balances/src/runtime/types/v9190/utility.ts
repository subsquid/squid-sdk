import {sts} from '../../pallet.support'
import {OriginCaller, Call, Type_51, DispatchError} from './types'

/**
 * Dispatches a function call with a provided origin.
 * 
 * The dispatch origin for this call must be _Root_.
 * 
 * # <weight>
 * - O(1).
 * - Limited storage reads.
 * - One DB write (event).
 * - Weight of derivative `call` execution + T::WeightInfo::dispatch_as().
 * # </weight>
 */
export type UtilityDispatchAsCall = {
    asOrigin: OriginCaller,
    call: Call,
}

export const UtilityDispatchAsCall: sts.Type<UtilityDispatchAsCall> = sts.struct(() => {
    return  {
        asOrigin: OriginCaller,
        call: Call,
    }
})

/**
 * Send a batch of dispatch calls and atomically execute them.
 * The whole transaction will rollback and fail if any of the calls failed.
 * 
 * May be called from any origin.
 * 
 * - `calls`: The calls to be dispatched from the same origin. The number of call must not
 *   exceed the constant: `batched_calls_limit` (available in constant metadata).
 * 
 * If origin is root then call are dispatch without checking origin filter. (This includes
 * bypassing `frame_system::Config::BaseCallFilter`).
 * 
 * # <weight>
 * - Complexity: O(C) where C is the number of calls to be batched.
 * # </weight>
 */
export type UtilityBatchAllCall = {
    calls: Call[],
}

export const UtilityBatchAllCall: sts.Type<UtilityBatchAllCall> = sts.struct(() => {
    return  {
        calls: sts.array(() => Call),
    }
})

/**
 * Send a batch of dispatch calls.
 * 
 * May be called from any origin.
 * 
 * - `calls`: The calls to be dispatched from the same origin. The number of call must not
 *   exceed the constant: `batched_calls_limit` (available in constant metadata).
 * 
 * If origin is root then call are dispatch without checking origin filter. (This includes
 * bypassing `frame_system::Config::BaseCallFilter`).
 * 
 * # <weight>
 * - Complexity: O(C) where C is the number of calls to be batched.
 * # </weight>
 * 
 * This will return `Ok` in all circumstances. To determine the success of the batch, an
 * event is deposited. If a call failed and the batch was interrupted, then the
 * `BatchInterrupted` event is deposited, along with the number of successful calls made
 * and the error of the failed call. If all were successful, then the `BatchCompleted`
 * event is deposited.
 */
export type UtilityBatchCall = {
    calls: Call[],
}

export const UtilityBatchCall: sts.Type<UtilityBatchCall> = sts.struct(() => {
    return  {
        calls: sts.array(() => Call),
    }
})

/**
 * Send a call through an indexed pseudonym of the sender.
 * 
 * Filter from origin are passed along. The call will be dispatched with an origin which
 * use the same filter as the origin of this call.
 * 
 * NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
 * because you expect `proxy` to have been used prior in the call stack and you do not want
 * the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
 * in the Multisig pallet instead.
 * 
 * NOTE: Prior to version *12, this was called `as_limited_sub`.
 * 
 * The dispatch origin for this call must be _Signed_.
 */
export type UtilityAsDerivativeCall = {
    index: number,
    call: Call,
}

export const UtilityAsDerivativeCall: sts.Type<UtilityAsDerivativeCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        call: Call,
    }
})

/**
 * A call was dispatched.
 */
export type UtilityDispatchedAsEvent = {
    result: Type_51,
}

export const UtilityDispatchedAsEvent: sts.Type<UtilityDispatchedAsEvent> = sts.struct(() => {
    return  {
        result: Type_51,
    }
})

/**
 * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
 * well as the error.
 */
export type UtilityBatchInterruptedEvent = {
    index: number,
    error: DispatchError,
}

export const UtilityBatchInterruptedEvent: sts.Type<UtilityBatchInterruptedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        error: DispatchError,
    }
})
