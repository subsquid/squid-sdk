import {sts} from '../../pallet.support'
import {AccountId, AccountIndex} from './types'

/**
 *  Assign an index already owned by the sender to another account. The balance reservation
 *  is effectively transferred to the new account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `index`: the index to be re-assigned. This must be owned by the sender.
 *  - `new`: the new owner of the index. This function is a no-op if it is equal to sender.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One transfer operation.
 *  - One event.
 *  # </weight>
 */
export type IndicesTransferCall = {
    new: AccountId,
    index: AccountIndex,
}

export const IndicesTransferCall: sts.Type<IndicesTransferCall> = sts.struct(() => {
    return  {
        new: AccountId,
        index: AccountIndex,
    }
})

/**
 *  Free up an index owned by the sender.
 * 
 *  Payment: Any previous deposit placed for the index is unreserved in the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must own the index.
 * 
 *  - `index`: the index to be freed. This must be owned by the sender.
 * 
 *  Emits `IndexFreed` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One reserve operation.
 *  - One event.
 *  # </weight>
 */
export type IndicesFreeCall = {
    index: AccountIndex,
}

export const IndicesFreeCall: sts.Type<IndicesFreeCall> = sts.struct(() => {
    return  {
        index: AccountIndex,
    }
})

/**
 *  Force an index to an account. This doesn't require a deposit. If the index is already
 *  held, then any deposit is reimbursed to its current owner.
 * 
 *  The dispatch origin for this call must be _Root_.
 * 
 *  - `index`: the index to be (re-)assigned.
 *  - `new`: the new owner of the index. This function is a no-op if it is equal to sender.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - Up to one reserve operation.
 *  - One event.
 *  # </weight>
 */
export type IndicesForceTransferCall = {
    new: AccountId,
    index: AccountIndex,
}

export const IndicesForceTransferCall: sts.Type<IndicesForceTransferCall> = sts.struct(() => {
    return  {
        new: AccountId,
        index: AccountIndex,
    }
})

/**
 *  Assign an previously unassigned index.
 * 
 *  Payment: `Deposit` is reserved from the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `index`: the index to be claimed. This must not be in use.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One reserve operation.
 *  - One event.
 *  # </weight>
 */
export type IndicesClaimCall = {
    index: AccountIndex,
}

export const IndicesClaimCall: sts.Type<IndicesClaimCall> = sts.struct(() => {
    return  {
        index: AccountIndex,
    }
})

/**
 *  A account index has been freed up (unassigned).
 */
export type IndicesIndexFreedEvent = [AccountIndex]

export const IndicesIndexFreedEvent: sts.Type<IndicesIndexFreedEvent> = sts.tuple(() => AccountIndex)

/**
 *  A account index was assigned.
 */
export type IndicesIndexAssignedEvent = [AccountId, AccountIndex]

export const IndicesIndexAssignedEvent: sts.Type<IndicesIndexAssignedEvent> = sts.tuple(() => AccountId, AccountIndex)
