import {sts} from '../../pallet.support'
import {MultiAddress, AccountId32, BalanceStatus} from './types'

/**
 * Same as the [`transfer`] call, but with a check that the transfer will not kill the
 * origin account.
 * 
 * 99% of the time you want [`transfer`] instead.
 * 
 * [`transfer`]: struct.Pallet.html#method.transfer
 */
export type NisCounterpartBalancesTransferKeepAliveCall = {
    dest: MultiAddress,
    value: bigint,
}

export const NisCounterpartBalancesTransferKeepAliveCall: sts.Type<NisCounterpartBalancesTransferKeepAliveCall> = sts.struct(() => {
    return  {
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
export type NisCounterpartBalancesTransferAllCall = {
    dest: MultiAddress,
    keepAlive: boolean,
}

export const NisCounterpartBalancesTransferAllCall: sts.Type<NisCounterpartBalancesTransferAllCall> = sts.struct(() => {
    return  {
        dest: MultiAddress,
        keepAlive: sts.boolean(),
    }
})

/**
 * Transfer some liquid free balance to another account.
 * 
 * `transfer` will set the `FreeBalance` of the sender and receiver.
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
 * - Origin account is already in memory, so no DB operations for them.
 * # </weight>
 */
export type NisCounterpartBalancesTransferCall = {
    dest: MultiAddress,
    value: bigint,
}

export const NisCounterpartBalancesTransferCall: sts.Type<NisCounterpartBalancesTransferCall> = sts.struct(() => {
    return  {
        dest: MultiAddress,
        value: sts.bigint(),
    }
})

/**
 * Set the balances of a given account.
 * 
 * This will alter `FreeBalance` and `ReservedBalance` in storage. it will
 * also alter the total issuance of the system (`TotalIssuance`) appropriately.
 * If the new free or reserved balance is below the existential deposit,
 * it will reset the account nonce (`frame_system::AccountNonce`).
 * 
 * The dispatch origin for this call is `root`.
 */
export type NisCounterpartBalancesSetBalanceCall = {
    who: MultiAddress,
    newFree: bigint,
    newReserved: bigint,
}

export const NisCounterpartBalancesSetBalanceCall: sts.Type<NisCounterpartBalancesSetBalanceCall> = sts.struct(() => {
    return  {
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
export type NisCounterpartBalancesForceUnreserveCall = {
    who: MultiAddress,
    amount: bigint,
}

export const NisCounterpartBalancesForceUnreserveCall: sts.Type<NisCounterpartBalancesForceUnreserveCall> = sts.struct(() => {
    return  {
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
export type NisCounterpartBalancesForceTransferCall = {
    source: MultiAddress,
    dest: MultiAddress,
    value: bigint,
}

export const NisCounterpartBalancesForceTransferCall: sts.Type<NisCounterpartBalancesForceTransferCall> = sts.struct(() => {
    return  {
        source: MultiAddress,
        dest: MultiAddress,
        value: sts.bigint(),
    }
})

/**
 * Some amount was withdrawn from the account (e.g. for transaction fees).
 */
export type NisCounterpartBalancesWithdrawEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesWithdrawEvent: sts.Type<NisCounterpartBalancesWithdrawEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was unreserved (moved from reserved to free).
 */
export type NisCounterpartBalancesUnreservedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesUnreservedEvent: sts.Type<NisCounterpartBalancesUnreservedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Transfer succeeded.
 */
export type NisCounterpartBalancesTransferEvent = {
    from: AccountId32,
    to: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesTransferEvent: sts.Type<NisCounterpartBalancesTransferEvent> = sts.struct(() => {
    return  {
        from: AccountId32,
        to: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was removed from the account (e.g. for misbehavior).
 */
export type NisCounterpartBalancesSlashedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesSlashedEvent: sts.Type<NisCounterpartBalancesSlashedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was reserved (moved from free to reserved).
 */
export type NisCounterpartBalancesReservedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesReservedEvent: sts.Type<NisCounterpartBalancesReservedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was moved from the reserve of the first account to the second account.
 * Final argument indicates the destination balance type.
 */
export type NisCounterpartBalancesReserveRepatriatedEvent = {
    from: AccountId32,
    to: AccountId32,
    amount: bigint,
    destinationStatus: BalanceStatus,
}

export const NisCounterpartBalancesReserveRepatriatedEvent: sts.Type<NisCounterpartBalancesReserveRepatriatedEvent> = sts.struct(() => {
    return  {
        from: AccountId32,
        to: AccountId32,
        amount: sts.bigint(),
        destinationStatus: BalanceStatus,
    }
})

/**
 * An account was created with some free balance.
 */
export type NisCounterpartBalancesEndowedEvent = {
    account: AccountId32,
    freeBalance: bigint,
}

export const NisCounterpartBalancesEndowedEvent: sts.Type<NisCounterpartBalancesEndowedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
        freeBalance: sts.bigint(),
    }
})

/**
 * An account was removed whose balance was non-zero but below ExistentialDeposit,
 * resulting in an outright loss.
 */
export type NisCounterpartBalancesDustLostEvent = {
    account: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesDustLostEvent: sts.Type<NisCounterpartBalancesDustLostEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was deposited (e.g. for transaction fees).
 */
export type NisCounterpartBalancesDepositEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesDepositEvent: sts.Type<NisCounterpartBalancesDepositEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A balance was set by root.
 */
export type NisCounterpartBalancesBalanceSetEvent = {
    who: AccountId32,
    free: bigint,
    reserved: bigint,
}

export const NisCounterpartBalancesBalanceSetEvent: sts.Type<NisCounterpartBalancesBalanceSetEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        free: sts.bigint(),
        reserved: sts.bigint(),
    }
})
