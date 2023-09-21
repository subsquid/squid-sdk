import {sts} from '../../pallet.support'
import {Key} from './types'

/**
 *  Kill all storage items with a key that starts with the given prefix.
 * 
 *  **NOTE:** We rely on the Root origin to provide us the number of subkeys under
 *  the prefix we are removing to accurately calculate the weight of this function.
 * 
 *  # <weight>
 *  - `O(P)` where `P` amount of keys with prefix `prefix`
 *  - `P` storage deletions.
 *  - Base Weight: 0.834 * P µs
 *  - Writes: Number of subkeys + 1
 *  # </weight>
 */
export type SystemKillPrefixCall = {
    prefix: Key,
    _subkeys: number,
}

export const SystemKillPrefixCall: sts.Type<SystemKillPrefixCall> = sts.struct(() => {
    return  {
        prefix: Key,
        _subkeys: sts.number(),
    }
})
