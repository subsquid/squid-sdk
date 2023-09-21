import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Change the account associated with a registrar.
 * 
 * The dispatch origin for this call must be _Signed_ and the sender must be the account
 * of the registrar whose index is `index`.
 * 
 * - `index`: the index of the registrar whose fee is to be set.
 * - `new`: the new account ID.
 * 
 * # <weight>
 * - `O(R)`.
 * - One storage mutation `O(R)`.
 * - Benchmark: 8.823 + R * 0.32 µs (min squares analysis)
 * # </weight>
 */
export type IdentitySetAccountIdCall = {
    index: number,
    new: MultiAddress,
}

export const IdentitySetAccountIdCall: sts.Type<IdentitySetAccountIdCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        new: MultiAddress,
    }
})

/**
 * Add a registrar to the system.
 * 
 * The dispatch origin for this call must be `T::RegistrarOrigin`.
 * 
 * - `account`: the account of the registrar.
 * 
 * Emits `RegistrarAdded` if successful.
 * 
 * # <weight>
 * - `O(R)` where `R` registrar-count (governance-bounded and code-bounded).
 * - One storage mutation (codec `O(R)`).
 * - One event.
 * # </weight>
 */
export type IdentityAddRegistrarCall = {
    account: MultiAddress,
}

export const IdentityAddRegistrarCall: sts.Type<IdentityAddRegistrarCall> = sts.struct(() => {
    return  {
        account: MultiAddress,
    }
})
