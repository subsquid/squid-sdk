import {sts} from '../../pallet.support'
import {Keys} from './types'

/**
 *  Sets the session key(s) of the function caller to `keys`.
 *  Allows an account to set its session key prior to becoming a validator.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - Complexity: `O(1)`
 *    Actual cost depends on the number of length of `T::Keys::key_ids()` which is fixed.
 *  - DbReads: `origin account`, `T::ValidatorIdOf`, `NextKeys`
 *  - DbWrites: `origin account`, `NextKeys`
 *  - DbReads per key id: `KeyOwner`
 *  - DbWrites per key id: `KeyOwner`
 *  # </weight>
 */
export type SessionSetKeysCall = {
    keys: Keys,
    proof: Bytes,
}

export const SessionSetKeysCall: sts.Type<SessionSetKeysCall> = sts.struct(() => {
    return  {
        keys: Keys,
        proof: sts.bytes(),
    }
})
