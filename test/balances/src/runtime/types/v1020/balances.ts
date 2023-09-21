import {sts} from '../../pallet.support'
import {AccountId, VestingSchedule, Balance, BalanceLock, LookupSource} from './types'

/**
 *  Information regarding the vesting of a given account.
 */
export type BalancesVestingStorage = [[AccountId], VestingSchedule]

export const BalancesVestingStorage: sts.Type<BalancesVestingStorage> = sts.tuple([sts.tuple(() => [AccountId]), VestingSchedule])

/**
 *  The total units issued in the system.
 */
export type BalancesTotalIssuanceStorage = [null, Balance]

export const BalancesTotalIssuanceStorage: sts.Type<BalancesTotalIssuanceStorage> = sts.tuple([sts.unit(), Balance])

/**
 *  The amount of the balance of a given account that is externally reserved; this can still get
 *  slashed, but gets slashed last of all.
 * 
 *  This balance is a 'reserve' balance that other subsystems use in order to set aside tokens
 *  that are still 'owned' by the account holder, but which are suspendable.
 * 
 *  When this balance falls below the value of `ExistentialDeposit`, then this 'reserve account'
 *  is deleted: specifically, `ReservedBalance`.
 * 
 *  `system::AccountNonce` is also deleted if `FreeBalance` is also zero (it also gets
 *  collapsed to zero if it ever becomes less than `ExistentialDeposit`.)
 */
export type BalancesReservedBalanceStorage = [[AccountId], Balance]

export const BalancesReservedBalanceStorage: sts.Type<BalancesReservedBalanceStorage> = sts.tuple([sts.tuple(() => [AccountId]), Balance])

/**
 *  Any liquidity locks on some account balances.
 */
export type BalancesLocksStorage = [[AccountId], BalanceLock[]]

export const BalancesLocksStorage: sts.Type<BalancesLocksStorage> = sts.tuple([sts.tuple(() => [AccountId]), sts.array(() => BalanceLock)])

/**
 *  The 'free' balance of a given account.
 * 
 *  This is the only balance that matters in terms of most operations on tokens. It
 *  alone is used to determine the balance when in the contract execution environment. When this
 *  balance falls below the value of `ExistentialDeposit`, then the 'current account' is
 *  deleted: specifically `FreeBalance`. Further, the `OnFreeBalanceZero` callback
 *  is invoked, giving a chance to external modules to clean up data associated with
 *  the deleted account.
 * 
 *  `system::AccountNonce` is also deleted if `ReservedBalance` is also zero (it also gets
 *  collapsed to zero if it ever becomes less than `ExistentialDeposit`.
 */
export type BalancesFreeBalanceStorage = [[AccountId], Balance]

export const BalancesFreeBalanceStorage: sts.Type<BalancesFreeBalanceStorage> = sts.tuple([sts.tuple(() => [AccountId]), Balance])

/**
 *  The fee required to make a transfer.
 */
export type BalancesTransferFeeConstant = Balance

export const BalancesTransferFeeConstant: sts.Type<BalancesTransferFeeConstant> = Balance

/**
 *  The minimum amount required to keep an account open.
 */
export type BalancesExistentialDepositConstant = Balance

export const BalancesExistentialDepositConstant: sts.Type<BalancesExistentialDepositConstant> = Balance

/**
 *  The fee required to create an account.
 */
export type BalancesCreationFeeConstant = Balance

export const BalancesCreationFeeConstant: sts.Type<BalancesCreationFeeConstant> = Balance

/**
 *  Same as the [`transfer`] call, but with a check that the transfer will not kill the
 *  origin account.
 * 
 *  99% of the time you want [`transfer`] instead.
 * 
 *  [`transfer`]: struct.Module.html#method.transfer
 */
export type BalancesTransferKeepAliveCall = {
    dest: LookupSource,
    value: bigint,
}

export const BalancesTransferKeepAliveCall: sts.Type<BalancesTransferKeepAliveCall> = sts.struct(() => {
    return {
        dest: LookupSource,
        value: sts.bigint(),
    }
})

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
export type BalancesTransferCall = {
    dest: LookupSource,
    value: bigint,
}

export const BalancesTransferCall: sts.Type<BalancesTransferCall> = sts.struct(() => {
    return {
        dest: LookupSource,
        value: sts.bigint(),
    }
})

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
export type BalancesSetBalanceCall = {
    who: LookupSource,
    new_free: bigint,
    new_reserved: bigint,
}

export const BalancesSetBalanceCall: sts.Type<BalancesSetBalanceCall> = sts.struct(() => {
    return {
        who: LookupSource,
        new_free: sts.bigint(),
        new_reserved: sts.bigint(),
    }
})

/**
 *  Exactly as `transfer`, except the origin must be root and the source account may be
 *  specified.
 */
export type BalancesForceTransferCall = {
    source: LookupSource,
    dest: LookupSource,
    value: bigint,
}

export const BalancesForceTransferCall: sts.Type<BalancesForceTransferCall> = sts.struct(() => {
    return {
        source: LookupSource,
        dest: LookupSource,
        value: sts.bigint(),
    }
})

/**
 *  Transfer succeeded (from, to, value, fees).
 */
export type BalancesTransferEvent = [AccountId, AccountId, Balance, Balance]

export const BalancesTransferEvent: sts.Type<BalancesTransferEvent> = sts.tuple(() => [AccountId, AccountId, Balance, Balance])

/**
 *  An account was reaped.
 */
export type BalancesReapedAccountEvent = [AccountId]

export const BalancesReapedAccountEvent: sts.Type<BalancesReapedAccountEvent> = sts.tuple(() => [AccountId])

/**
 *  A new account was created.
 */
export type BalancesNewAccountEvent = [AccountId, Balance]

export const BalancesNewAccountEvent: sts.Type<BalancesNewAccountEvent> = sts.tuple(() => [AccountId, Balance])
