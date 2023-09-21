import {sts} from '../../pallet.support'
import {Type_188} from './types'

/**
 *  Send a batch of dispatch calls.
 * 
 *  This will execute until the first one fails and then stop. Calls must fulfil the
 *  `IsCallable` filter unless the origin is `Root`.
 * 
 *  May be called from any origin.
 * 
 *  - `calls`: The calls to be dispatched from the same origin.
 * 
 *  # <weight>
 *  - Base weight: 14.39 + .987 * c µs
 *  - Plus the sum of the weights of the `calls`.
 *  - Plus one additional event. (repeat read/write)
 *  # </weight>
 * 
 *  This will return `Ok` in all circumstances. To determine the success of the batch, an
 *  event is deposited. If a call failed and the batch was interrupted, then the
 *  `BatchInterrupted` event is deposited, along with the number of successful calls made
 *  and the error of the failed call. If all were successful, then the `BatchCompleted`
 *  event is deposited.
 */
export type UtilityBatchCall = {
    calls: Type_188[],
}

export const UtilityBatchCall: sts.Type<UtilityBatchCall> = sts.struct(() => {
    return  {
        calls: sts.array(() => Type_188),
    }
})

/**
 *  Send a call through an indexed pseudonym of the sender.
 * 
 *  The call must fulfil only the pre-cleared `IsCallable` filter (i.e. only the level of
 *  filtering that remains after calling `take()`).
 * 
 *  NOTE: If you need to ensure that any account-based filtering is honored (i.e. because
 *  you expect `proxy` to have been used prior in the call stack and you want it to apply to
 *  any sub-accounts), then use `as_limited_sub` instead.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - Base weight: 2.861 µs
 *  - Plus the weight of the `call`
 *  # </weight>
 */
export type UtilityAsSubCall = {
    index: number,
    call: Type_188,
}

export const UtilityAsSubCall: sts.Type<UtilityAsSubCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        call: Type_188,
    }
})

/**
 *  Send a call through an indexed pseudonym of the sender.
 * 
 *  Calls must each fulfil the `IsCallable` filter; it is not cleared before.
 * 
 *  NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
 *  because you expect `proxy` to have been used prior in the call stack and you do not want
 *  the call restrictions to apply to any sub-accounts), then use `as_sub` instead.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - Base weight: 2.861 µs
 *  - Plus the weight of the `call`
 *  # </weight>
 */
export type UtilityAsLimitedSubCall = {
    index: number,
    call: Type_188,
}

export const UtilityAsLimitedSubCall: sts.Type<UtilityAsLimitedSubCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        call: Type_188,
    }
})

/**
 *  A call with a `false` IsCallable filter was attempted.
 */
export type UtilityUncallableEvent = [number]

export const UtilityUncallableEvent: sts.Type<UtilityUncallableEvent> = sts.tuple(() => sts.number())
