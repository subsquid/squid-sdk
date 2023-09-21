import {sts} from '../../pallet.support'
import {Type_192} from './types'

/**
 *  Send a batch of dispatch calls.
 * 
 *  May be called from any origin.
 * 
 *  - `calls`: The calls to be dispatched from the same origin.
 * 
 *  If origin is root then call are dispatch without checking origin filter. (This includes
 *  bypassing `frame_system::Trait::BaseCallFilter`).
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
    calls: Type_192[],
}

export const UtilityBatchCall: sts.Type<UtilityBatchCall> = sts.struct(() => {
    return  {
        calls: sts.array(() => Type_192),
    }
})

/**
 *  Send a call through an indexed pseudonym of the sender.
 * 
 *  Filter from origin are passed along. The call will be dispatched with an origin which
 *  use the same filter as the origin of this call.
 * 
 *  NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
 *  because you expect `proxy` to have been used prior in the call stack and you do not want
 *  the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
 *  in the Multisig pallet instead.
 * 
 *  NOTE: Prior to version *12, this was called `as_limited_sub`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  # <weight>
 *  - Base weight: 2.861 µs
 *  - Plus the weight of the `call`
 *  # </weight>
 */
export type UtilityAsDerivativeCall = {
    index: number,
    call: Type_192,
}

export const UtilityAsDerivativeCall: sts.Type<UtilityAsDerivativeCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        call: Type_192,
    }
})
