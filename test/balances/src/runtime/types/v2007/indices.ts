import {sts} from '../../pallet.support'
import {AccountIndex, AccountId} from './types'

/**
 *  Freeze an index so it will always point to the sender account. This consumes the deposit.
 * 
 *  The dispatch origin for this call must be _Signed_ and the signing account must have a
 *  non-frozen account `index`.
 * 
 *  - `index`: the index to be frozen in place.
 * 
 *  Emits `IndexFrozen` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - Up to one slash operation.
 *  - One event.
 *  -------------------
 *  - Base Weight: 30.86 µs
 *  - DB Weight: 1 Read/Write (Accounts)
 *  # </weight>
 */
export type IndicesFreezeCall = {
    index: AccountIndex,
}

export const IndicesFreezeCall: sts.Type<IndicesFreezeCall> = sts.struct(() => {
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
 *  - `freeze`: if set to `true`, will freeze the index so it cannot be transferred.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - Up to one reserve operation.
 *  - One event.
 *  -------------------
 *  - Base Weight: 26.83 µs
 *  - DB Weight:
 *     - Reads: Indices Accounts, System Account (original owner)
 *     - Writes: Indices Accounts, System Account (original owner)
 *  # </weight>
 */
export type IndicesForceTransferCall = {
    new: AccountId,
    index: AccountIndex,
    freeze: boolean,
}

export const IndicesForceTransferCall: sts.Type<IndicesForceTransferCall> = sts.struct(() => {
    return  {
        new: AccountId,
        index: AccountIndex,
        freeze: sts.boolean(),
    }
})

/**
 *  A account index has been frozen to its current account ID.
 */
export type IndicesIndexFrozenEvent = [AccountIndex, AccountId]

export const IndicesIndexFrozenEvent: sts.Type<IndicesIndexFrozenEvent> = sts.tuple(() => AccountIndex, AccountId)
