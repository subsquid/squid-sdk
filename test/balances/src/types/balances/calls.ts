import {sts, Block, Bytes, Option, Result, CallType, call, RuntimeCtx} from '../support'
import * as v1020 from '../v1020'
import * as v1050 from '../v1050'
import * as v2028 from '../v2028'
import * as v9050 from '../v9050'
import * as v9111 from '../v9111'
import * as v9420 from '../v9420'
import * as v1002000 from '../v1002000'

export const transfer = call('Balances.transfer', {
    /**
     *  Transfer some liquid free balance to another account.
     * 
     *  `transfer` will set the `FreeBalance` of the sender and receiver.
     *  It will decrease the total issuance of the system by the `TransferFee`.
     *  If the sender's account is below the existential deposit as a result
     *  of the transfer, the account will be reaped.
     * 
     *  The dispatch origin for this call must be `Signed` by the transactor.
     * 
     *  # <weight>
     *  - Dependent on arguments but not critical, given proper implementations for
     *    input config types. See related functions below.
     *  - It contains a limited number of reads and writes internally and no complex computation.
     * 
     *  Related functions:
     * 
     *    - `ensure_can_withdraw` is always called internally but has a bounded complexity.
     *    - Transferring balances to accounts that did not exist before will cause
     *       `T::OnNewAccount::on_new_account` to be called.
     *    - Removing enough funds from an account will trigger
     *      `T::DustRemoval::on_unbalanced` and `T::OnFreeBalanceZero::on_free_balance_zero`.
     *    - `transfer_keep_alive` works the same way as `transfer`, but has an additional
     *      check that the transfer will not kill the origin account.
     * 
     *  # </weight>
     */
    v1020: sts.struct({
        dest: v1020.LookupSource,
        value: sts.bigint(),
    }),
    /**
     *  Transfer some liquid free balance to another account.
     * 
     *  `transfer` will set the `FreeBalance` of the sender and receiver.
     *  It will decrease the total issuance of the system by the `TransferFee`.
     *  If the sender's account is below the existential deposit as a result
     *  of the transfer, the account will be reaped.
     * 
     *  The dispatch origin for this call must be `Signed` by the transactor.
     * 
     *  # <weight>
     *  - Dependent on arguments but not critical, given proper implementations for
     *    input config types. See related functions below.
     *  - It contains a limited number of reads and writes internally and no complex computation.
     * 
     *  Related functions:
     * 
     *    - `ensure_can_withdraw` is always called internally but has a bounded complexity.
     *    - Transferring balances to accounts that did not exist before will cause
     *       `T::OnNewAccount::on_new_account` to be called.
     *    - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
     *    - `transfer_keep_alive` works the same way as `transfer`, but has an additional
     *      check that the transfer will not kill the origin account.
     * 
     *  # </weight>
     */
    v1050: sts.struct({
        dest: v1050.LookupSource,
        value: sts.bigint(),
    }),
    /**
     *  Transfer some liquid free balance to another account.
     * 
     *  `transfer` will set the `FreeBalance` of the sender and receiver.
     *  It will decrease the total issuance of the system by the `TransferFee`.
     *  If the sender's account is below the existential deposit as a result
     *  of the transfer, the account will be reaped.
     * 
     *  The dispatch origin for this call must be `Signed` by the transactor.
     * 
     *  # <weight>
     *  - Dependent on arguments but not critical, given proper implementations for
     *    input config types. See related functions below.
     *  - It contains a limited number of reads and writes internally and no complex computation.
     * 
     *  Related functions:
     * 
     *    - `ensure_can_withdraw` is always called internally but has a bounded complexity.
     *    - Transferring balances to accounts that did not exist before will cause
     *       `T::OnNewAccount::on_new_account` to be called.
     *    - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
     *    - `transfer_keep_alive` works the same way as `transfer`, but has an additional
     *      check that the transfer will not kill the origin account.
     *  ---------------------------------
     *  - Base Weight: 73.64 µs, worst case scenario (account created, account removed)
     *  - DB Weight: 1 Read and 1 Write to destination account
     *  - Origin account is already in memory, so no DB operations for them.
     *  # </weight>
     */
    v2028: sts.struct({
        dest: v2028.LookupSource,
        value: sts.bigint(),
    }),
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
    v9111: sts.struct({
        dest: v9111.MultiAddress,
        value: sts.bigint(),
    }),
})

export const setBalance = call('Balances.set_balance', {
    /**
     *  Set the balances of a given account.
     * 
     *  This will alter `FreeBalance` and `ReservedBalance` in storage. it will
     *  also decrease the total issuance of the system (`TotalIssuance`).
     *  If the new free or reserved balance is below the existential deposit,
     *  it will reset the account nonce (`system::AccountNonce`).
     * 
     *  The dispatch origin for this call is `root`.
     * 
     *  # <weight>
     *  - Independent of the arguments.
     *  - Contains a limited number of reads and writes.
     *  # </weight>
     */
    v1020: sts.struct({
        who: v1020.LookupSource,
        newFree: sts.bigint(),
        newReserved: sts.bigint(),
    }),
    /**
     *  Set the balances of a given account.
     * 
     *  This will alter `FreeBalance` and `ReservedBalance` in storage. it will
     *  also decrease the total issuance of the system (`TotalIssuance`).
     *  If the new free or reserved balance is below the existential deposit,
     *  it will reset the account nonce (`frame_system::AccountNonce`).
     * 
     *  The dispatch origin for this call is `root`.
     * 
     *  # <weight>
     *  - Independent of the arguments.
     *  - Contains a limited number of reads and writes.
     *  # </weight>
     */
    v1050: sts.struct({
        who: v1050.LookupSource,
        newFree: sts.bigint(),
        newReserved: sts.bigint(),
    }),
    /**
     *  Set the balances of a given account.
     * 
     *  This will alter `FreeBalance` and `ReservedBalance` in storage. it will
     *  also decrease the total issuance of the system (`TotalIssuance`).
     *  If the new free or reserved balance is below the existential deposit,
     *  it will reset the account nonce (`frame_system::AccountNonce`).
     * 
     *  The dispatch origin for this call is `root`.
     * 
     *  # <weight>
     *  - Independent of the arguments.
     *  - Contains a limited number of reads and writes.
     *  ---------------------
     *  - Base Weight:
     *      - Creating: 27.56 µs
     *      - Killing: 35.11 µs
     *  - DB Weight: 1 Read, 1 Write to `who`
     *  # </weight>
     */
    v2028: sts.struct({
        who: v2028.LookupSource,
        newFree: sts.bigint(),
        newReserved: sts.bigint(),
    }),
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
    v9111: sts.struct({
        who: v9111.MultiAddress,
        newFree: sts.bigint(),
        newReserved: sts.bigint(),
    }),
})

export const forceTransfer = call('Balances.force_transfer', {
    /**
     *  Exactly as `transfer`, except the origin must be root and the source account may be
     *  specified.
     */
    v1020: sts.struct({
        source: v1020.LookupSource,
        dest: v1020.LookupSource,
        value: sts.bigint(),
    }),
    /**
     *  Exactly as `transfer`, except the origin must be root and the source account may be
     *  specified.
     */
    v1050: sts.struct({
        source: v1050.LookupSource,
        dest: v1050.LookupSource,
        value: sts.bigint(),
    }),
    /**
     *  Exactly as `transfer`, except the origin must be root and the source account may be
     *  specified.
     *  # <weight>
     *  - Same as transfer, but additional read and write because the source account is
     *    not assumed to be in the overlay.
     *  # </weight>
     */
    v2028: sts.struct({
        source: v2028.LookupSource,
        dest: v2028.LookupSource,
        value: sts.bigint(),
    }),
    /**
     * Exactly as `transfer`, except the origin must be root and the source account may be
     * specified.
     * # <weight>
     * - Same as transfer, but additional read and write because the source account is not
     *   assumed to be in the overlay.
     * # </weight>
     */
    v9111: sts.struct({
        source: v9111.MultiAddress,
        dest: v9111.MultiAddress,
        value: sts.bigint(),
    }),
})

export const transferKeepAlive = call('Balances.transfer_keep_alive', {
    /**
     *  Same as the [`transfer`] call, but with a check that the transfer will not kill the
     *  origin account.
     * 
     *  99% of the time you want [`transfer`] instead.
     * 
     *  [`transfer`]: struct.Module.html#method.transfer
     */
    v1020: sts.struct({
        dest: v1020.LookupSource,
        value: sts.bigint(),
    }),
    /**
     *  Same as the [`transfer`] call, but with a check that the transfer will not kill the
     *  origin account.
     * 
     *  99% of the time you want [`transfer`] instead.
     * 
     *  [`transfer`]: struct.Module.html#method.transfer
     */
    v1050: sts.struct({
        dest: v1050.LookupSource,
        value: sts.bigint(),
    }),
    /**
     *  Same as the [`transfer`] call, but with a check that the transfer will not kill the
     *  origin account.
     * 
     *  99% of the time you want [`transfer`] instead.
     * 
     *  [`transfer`]: struct.Module.html#method.transfer
     *  # <weight>
     *  - Cheaper than transfer because account cannot be killed.
     *  - Base Weight: 51.4 µs
     *  - DB Weight: 1 Read and 1 Write to dest (sender is in overlay already)
     *  #</weight>
     */
    v2028: sts.struct({
        dest: v2028.LookupSource,
        value: sts.bigint(),
    }),
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
    v9111: sts.struct({
        dest: v9111.MultiAddress,
        value: sts.bigint(),
    }),
})

export const transferAll = call('Balances.transfer_all', {
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
    v9050: sts.struct({
        dest: v9050.LookupSource,
        keepAlive: sts.boolean(),
    }),
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
    v9111: sts.struct({
        dest: v9111.MultiAddress,
        keepAlive: sts.boolean(),
    }),
})

export const forceUnreserve = call('Balances.force_unreserve', {
    /**
     * Unreserve some balance from a user by force.
     * 
     * Can only be called by ROOT.
     */
    v9111: sts.struct({
        who: v9111.MultiAddress,
        amount: sts.bigint(),
    }),
})

export const transferAllowDeath = call('Balances.transfer_allow_death', {
    /**
     * Transfer some liquid free balance to another account.
     * 
     * `transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
     * If the sender's account is below the existential deposit as a result
     * of the transfer, the account will be reaped.
     * 
     * The dispatch origin for this call must be `Signed` by the transactor.
     */
    v9420: sts.struct({
        dest: v9420.MultiAddress,
        value: sts.bigint(),
    }),
})

export const setBalanceDeprecated = call('Balances.set_balance_deprecated', {
    /**
     * Set the regular balance of a given account; it also takes a reserved balance but this
     * must be the same as the account's current reserved balance.
     * 
     * The dispatch origin for this call is `root`.
     * 
     * WARNING: This call is DEPRECATED! Use `force_set_balance` instead.
     */
    v9420: sts.struct({
        who: v9420.MultiAddress,
        newFree: sts.bigint(),
        oldReserved: sts.bigint(),
    }),
})

export const upgradeAccounts = call('Balances.upgrade_accounts', {
    /**
     * Upgrade a specified account.
     * 
     * - `origin`: Must be `Signed`.
     * - `who`: The account to be upgraded.
     * 
     * This will waive the transaction fee if at least all but 10% of the accounts needed to
     * be upgraded. (We let some not have to be upgraded just in order to allow for the
     * possibililty of churn).
     */
    v9420: sts.struct({
        who: sts.array(() => v9420.AccountId32),
    }),
})

export const forceSetBalance = call('Balances.force_set_balance', {
    /**
     * Set the regular balance of a given account.
     * 
     * The dispatch origin for this call is `root`.
     */
    v9420: sts.struct({
        who: v9420.MultiAddress,
        newFree: sts.bigint(),
    }),
})

export const forceAdjustTotalIssuance = call('Balances.force_adjust_total_issuance', {
    /**
     * See [`Pallet::force_adjust_total_issuance`].
     */
    v1002000: sts.struct({
        direction: v1002000.AdjustmentDirection,
        delta: sts.bigint(),
    }),
})
