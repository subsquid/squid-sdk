import {sts} from '../../pallet.support'
import {AccountId32, Call} from './types'

/**
 * Immediately dispatch a multi-signature call using a single approval from the caller.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * - `other_signatories`: The accounts (other than the sender) who are part of the
 * multi-signature, but do not participate in the approval process.
 * - `call`: The call to be executed.
 * 
 * Result is equivalent to the dispatched result.
 * 
 * # <weight>
 * O(Z + C) where Z is the length of the call and C its execution weight.
 * -------------------------------
 * - DB Weight: None
 * - Plus Call Weight
 * # </weight>
 */
export type MultisigAsMultiThreshold1Call = {
    otherSignatories: AccountId32[],
    call: Call,
}

export const MultisigAsMultiThreshold1Call: sts.Type<MultisigAsMultiThreshold1Call> = sts.struct(() => {
    return  {
        otherSignatories: sts.array(() => AccountId32),
        call: Call,
    }
})
