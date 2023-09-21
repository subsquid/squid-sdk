import {sts} from '../../pallet.support'
import {AccountId, Type_190} from './types'

/**
 *  Immediately dispatch a multi-signature call using a single approval from the caller.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `other_signatories`: The accounts (other than the sender) who are part of the
 *  multi-signature, but do not participate in the approval process.
 *  - `call`: The call to be executed.
 * 
 *  Result is equivalent to the dispatched result.
 * 
 *  # <weight>
 *  O(Z + C) where Z is the length of the call and C its execution weight.
 *  -------------------------------
 *  - Base Weight: 33.72 + 0.002 * Z µs
 *  - DB Weight: None
 *  - Plus Call Weight
 *  # </weight>
 */
export type MultisigAsMultiThreshold1Call = {
    other_signatories: AccountId[],
    call: Type_190,
}

export const MultisigAsMultiThreshold1Call: sts.Type<MultisigAsMultiThreshold1Call> = sts.struct(() => {
    return  {
        other_signatories: sts.array(() => AccountId),
        call: Type_190,
    }
})
