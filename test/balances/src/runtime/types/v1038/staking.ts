import {sts} from '../../pallet.support'

/**
 *  Rebond a portion of the stash scheduled to be unlocked.
 * 
 *  # <weight>
 *  - Time complexity: O(1). Bounded by `MAX_UNLOCKING_CHUNKS`.
 *  - Storage changes: Can't increase storage, only decrease it.
 *  # </weight>
 */
export type StakingRebondCall = {
    value: bigint,
}

export const StakingRebondCall: sts.Type<StakingRebondCall> = sts.struct(() => {
    return  {
        value: sts.bigint(),
    }
})
