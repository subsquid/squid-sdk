import {sts} from '../../pallet.support'
import {AccountId} from './types'

/**
 *  Change the account associated with a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `new`: the new account ID.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  # </weight>
 */
export type IdentitySetAccountIdCall = {
    index: number,
    new: AccountId,
}

export const IdentitySetAccountIdCall: sts.Type<IdentitySetAccountIdCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        new: AccountId,
    }
})
