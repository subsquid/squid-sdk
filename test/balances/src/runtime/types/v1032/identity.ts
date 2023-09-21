import {sts} from '../../pallet.support'
import {IdentityInfo} from './types'

/**
 *  Set an account's identity information and reserve the appropriate deposit.
 * 
 *  If the account already has identity information, the deposit is taken as part payment
 *  for the new deposit.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  - `info`: The identity information.
 * 
 *  Emits `IdentitySet` if successful.
 * 
 *  # <weight>
 *  - `O(X + R)` where `X` additional-field-count (deposit-bounded).
 *  - At most two balance operations.
 *  - One storage mutation (codec `O(X + R)`).
 *  - One event.
 *  # </weight>
 */
export type IdentitySetIdentityCall = {
    info: IdentityInfo,
}

export const IdentitySetIdentityCall: sts.Type<IdentitySetIdentityCall> = sts.struct(() => {
    return  {
        info: IdentityInfo,
    }
})
