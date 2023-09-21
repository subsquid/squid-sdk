import {sts} from '../../pallet.support'
import {AccountId, ReserveData, LookupSource} from './types'

/**
 *  Named reserves on some account balances.
 */
export type BalancesReservesStorage = [[AccountId], ReserveData[]]

export const BalancesReservesStorage: sts.Type<BalancesReservesStorage> = sts.tuple([sts.tuple(() => [AccountId]), sts.array(() => ReserveData)])

/**
 *  Transfer the entire transferable balance from the caller account.
 * 
 *  NOTE: This function only attempts to transfer _transferable_ balances. This means that
 *  any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
 *  transferred by this function. To ensure that this function results in a killed account,
 *  you might need to prepare the account by removing any reference counters, storage
 *  deposits, etc...
 * 
 *  The dispatch origin of this call must be Signed.
 * 
 *  - `dest`: The recipient of the transfer.
 *  - `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
 *    of the funds the account has, causing the sender account to be killed (false), or
 *    transfer everything except at least the existential deposit, which will guarantee to
 *    keep the sender account alive (true).
 *    # <weight>
 *  - O(1). Just like transfer, but reading the user's transferable balance first.
 *    #</weight>
 */
export type BalancesTransferAllCall = {
    dest: LookupSource,
    keep_alive: boolean,
}

export const BalancesTransferAllCall: sts.Type<BalancesTransferAllCall> = sts.struct(() => {
    return {
        dest: LookupSource,
        keep_alive: sts.boolean(),
    }
})
