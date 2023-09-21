import {sts} from '../../pallet.support'
import {Releases, AccountId, BalanceLock, AccountData, LookupSource, Balance} from './types'

/**
 *  Storage version of the pallet.
 * 
 *  This is set to v2.0.0 for new networks.
 */
export type BalancesStorageVersionStorage = [null, Releases]

export const BalancesStorageVersionStorage: sts.Type<BalancesStorageVersionStorage> = sts.tuple([sts.unit(), Releases])

/**
 *  Any liquidity locks on some account balances.
 *  NOTE: Should only be accessed when setting, changing and freeing a lock.
 */
export type BalancesLocksStorage = [[AccountId], BalanceLock[]]

export const BalancesLocksStorage: sts.Type<BalancesLocksStorage> = sts.tuple([sts.tuple(() => [AccountId]), sts.array(() => BalanceLock)])

/**
 *  The balance of an account.
 * 
 *  NOTE: THIS MAY NEVER BE IN EXISTENCE AND YET HAVE A `total().is_zero()`. If the total
 *  is ever zero, then the entry *MUST* be removed.
 * 
 *  NOTE: This is only used in the case that this module is used to store balances.
 */
export type BalancesAccountStorage = [[AccountId], AccountData]

export const BalancesAccountStorage: sts.Type<BalancesAccountStorage> = sts.tuple([sts.tuple(() => [AccountId]), AccountData])

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
 *    - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
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
 *  it will reset the account nonce (`frame_system::AccountNonce`).
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
 *  Transfer succeeded (from, to, value).
 */
export type BalancesTransferEvent = [AccountId, AccountId, Balance]

export const BalancesTransferEvent: sts.Type<BalancesTransferEvent> = sts.tuple(() => [AccountId, AccountId, Balance])

/**
 *  An account was created with some free balance.
 */
export type BalancesEndowedEvent = [AccountId, Balance]

export const BalancesEndowedEvent: sts.Type<BalancesEndowedEvent> = sts.tuple(() => [AccountId, Balance])

/**
 *  An account was removed whose balance was non-zero but below ExistentialDeposit,
 *  resulting in an outright loss.
 */
export type BalancesDustLostEvent = [AccountId, Balance]

export const BalancesDustLostEvent: sts.Type<BalancesDustLostEvent> = sts.tuple(() => [AccountId, Balance])
