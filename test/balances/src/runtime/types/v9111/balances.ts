import {sts} from '../../pallet.support'
import {Releases, MultiAddress} from './types'

/**
 *  Storage version of the pallet.
 * 
 *  This is set to v2.0.0 for new networks.
 */
export type BalancesStorageVersionStorage = [null, Releases]

export const BalancesStorageVersionStorage: sts.Type<BalancesStorageVersionStorage> = sts.tuple([sts.unit(), Releases])

/**
 * Same as the [`transfer`] call, but with a check that the transfer will not kill the
 * origin account.
 * 
 * 99% of the time you want [`transfer`] instead.
 * 
 * [`transfer`]: struct.Pallet.html#method.transfer
 * # <weight>
 * - Cheaper than transfer because account cannot be killed.
 * - Base Weight: 51.4 µs
 * - DB Weight: 1 Read and 1 Write to dest (sender is in overlay already)
 * #</weight>
 */
export type BalancesTransferKeepAliveCall = {
    dest: MultiAddress,
    value: bigint,
}

export const BalancesTransferKeepAliveCall: sts.Type<BalancesTransferKeepAliveCall> = sts.struct(() => {
    return {
        dest: MultiAddress,
        value: sts.bigint(),
    }
})

/**
 * Transfer the entire transferable balance from the caller account.
 * 
 * NOTE: This function only attempts to transfer _transferable_ balances. This means that
 * any locked, reserved, or existential deposits (when `keep_alive` is `true`), will not be
 * transferred by this function. To ensure that this function results in a killed account,
 * you might need to prepare the account by removing any reference counters, storage
 * deposits, etc...
 * 
 * The dispatch origin of this call must be Signed.
 * 
 * - `dest`: The recipient of the transfer.
 * - `keep_alive`: A boolean to determine if the `transfer_all` operation should send all
 *   of the funds the account has, causing the sender account to be killed (false), or
 *   transfer everything except at least the existential deposit, which will guarantee to
 *   keep the sender account alive (true). # <weight>
 * - O(1). Just like transfer, but reading the user's transferable balance first.
 *   #</weight>
 */
export type BalancesTransferAllCall = {
    dest: MultiAddress,
    keepAlive: boolean,
}

export const BalancesTransferAllCall: sts.Type<BalancesTransferAllCall> = sts.struct(() => {
    return {
        dest: MultiAddress,
        keepAlive: sts.boolean(),
    }
})

/**
 * Transfer some liquid free balance to another account.
 * 
 * `transfer` will set the `FreeBalance` of the sender and receiver.
 * It will decrease the total issuance of the system by the `TransferFee`.
 * If the sender's account is below the existential deposit as a result
 * of the transfer, the account will be reaped.
 * 
 * The dispatch origin for this call must be `Signed` by the transactor.
 * 
 * # <weight>
 * - Dependent on arguments but not critical, given proper implementations for input config
 *   types. See related functions below.
 * - It contains a limited number of reads and writes internally and no complex
 *   computation.
 * 
 * Related functions:
 * 
 *   - `ensure_can_withdraw` is always called internally but has a bounded complexity.
 *   - Transferring balances to accounts that did not exist before will cause
 *     `T::OnNewAccount::on_new_account` to be called.
 *   - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
 *   - `transfer_keep_alive` works the same way as `transfer`, but has an additional check
 *     that the transfer will not kill the origin account.
 * ---------------------------------
 * - Base Weight: 73.64 µs, worst case scenario (account created, account removed)
 * - DB Weight: 1 Read and 1 Write to destination account
 * - Origin account is already in memory, so no DB operations for them.
 * # </weight>
 */
export type BalancesTransferCall = {
    dest: MultiAddress,
    value: bigint,
}

export const BalancesTransferCall: sts.Type<BalancesTransferCall> = sts.struct(() => {
    return {
        dest: MultiAddress,
        value: sts.bigint(),
    }
})

/**
 * Set the balances of a given account.
 * 
 * This will alter `FreeBalance` and `ReservedBalance` in storage. it will
 * also decrease the total issuance of the system (`TotalIssuance`).
 * If the new free or reserved balance is below the existential deposit,
 * it will reset the account nonce (`frame_system::AccountNonce`).
 * 
 * The dispatch origin for this call is `root`.
 * 
 * # <weight>
 * - Independent of the arguments.
 * - Contains a limited number of reads and writes.
 * ---------------------
 * - Base Weight:
 *     - Creating: 27.56 µs
 *     - Killing: 35.11 µs
 * - DB Weight: 1 Read, 1 Write to `who`
 * # </weight>
 */
export type BalancesSetBalanceCall = {
    who: MultiAddress,
    newFree: bigint,
    newReserved: bigint,
}

export const BalancesSetBalanceCall: sts.Type<BalancesSetBalanceCall> = sts.struct(() => {
    return {
        who: MultiAddress,
        newFree: sts.bigint(),
        newReserved: sts.bigint(),
    }
})

/**
 * Unreserve some balance from a user by force.
 * 
 * Can only be called by ROOT.
 */
export type BalancesForceUnreserveCall = {
    who: MultiAddress,
    amount: bigint,
}

export const BalancesForceUnreserveCall: sts.Type<BalancesForceUnreserveCall> = sts.struct(() => {
    return {
        who: MultiAddress,
        amount: sts.bigint(),
    }
})

/**
 * Exactly as `transfer`, except the origin must be root and the source account may be
 * specified.
 * # <weight>
 * - Same as transfer, but additional read and write because the source account is not
 *   assumed to be in the overlay.
 * # </weight>
 */
export type BalancesForceTransferCall = {
    source: MultiAddress,
    dest: MultiAddress,
    value: bigint,
}

export const BalancesForceTransferCall: sts.Type<BalancesForceTransferCall> = sts.struct(() => {
    return {
        source: MultiAddress,
        dest: MultiAddress,
        value: sts.bigint(),
    }
})
