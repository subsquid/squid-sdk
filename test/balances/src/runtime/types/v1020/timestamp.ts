import {sts} from '../../pallet.support'

/**
 *  Set the current time.
 * 
 *  This call should be invoked exactly once per block. It will panic at the finalization
 *  phase, if this call hasn't been invoked by that time.
 * 
 *  The timestamp should be greater than the previous one by the amount specified by
 *  `MinimumPeriod`.
 * 
 *  The dispatch origin for this call must be `Inherent`.
 */
export type TimestampSetCall = {
    now: bigint,
}

export const TimestampSetCall: sts.Type<TimestampSetCall> = sts.struct(() => {
    return  {
        now: sts.bigint(),
    }
})
