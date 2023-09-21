import {sts} from '../../pallet.support'
import {AccountId32, IdAmount, Type_544, AccountData, MultiAddress} from './types'

/**
 *  Holds on account balances.
 */
export type BalancesHoldsStorage = [[AccountId32], IdAmount[]]

export const BalancesHoldsStorage: sts.Type<BalancesHoldsStorage> = sts.tuple([sts.tuple(() => [AccountId32]), sts.array(() => IdAmount)])

/**
 *  Freeze locks on account balances.
 */
export type BalancesFreezesStorage = [[AccountId32], Type_544[]]

export const BalancesFreezesStorage: sts.Type<BalancesFreezesStorage> = sts.tuple([sts.tuple(() => [AccountId32]), sts.array(() => Type_544)])

/**
 *  The Balances pallet example of storing the balance of an account.
 * 
 *  # Example
 * 
 *  ```nocompile
 *   impl pallet_balances::Config for Runtime {
 *     type AccountStore = StorageMapShim<Self::Account<Runtime>, frame_system::Provider<Runtime>, AccountId, Self::AccountData<Balance>>
 *   }
 *  ```
 * 
 *  You can also store the balance of an account in the `System` pallet.
 * 
 *  # Example
 * 
 *  ```nocompile
 *   impl pallet_balances::Config for Runtime {
 *    type AccountStore = System
 *   }
 *  ```
 * 
 *  But this comes with tradeoffs, storing account balances in the system pallet stores
 *  `frame_system` data alongside the account data contrary to storing account balances in the
 *  `Balances` pallet, which uses a `StorageMap` to store balances data only.
 *  NOTE: This is only used in the case that this pallet is used to store balances.
 */
export type BalancesAccountStorage = [[AccountId32], AccountData]

export const BalancesAccountStorage: sts.Type<BalancesAccountStorage> = sts.tuple([sts.tuple(() => [AccountId32]), AccountData])

/**
 *  The maximum number of holds that can exist on an account at any time.
 */
export type BalancesMaxHoldsConstant = number

export const BalancesMaxHoldsConstant: sts.Type<BalancesMaxHoldsConstant> = sts.number()

/**
 *  The maximum number of individual freeze locks that can exist on an account at any time.
 */
export type BalancesMaxFreezesConstant = number

export const BalancesMaxFreezesConstant: sts.Type<BalancesMaxFreezesConstant> = sts.number()

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
export type BalancesUpgradeAccountsCall = {
    who: AccountId32[],
}

export const BalancesUpgradeAccountsCall: sts.Type<BalancesUpgradeAccountsCall> = sts.struct(() => {
    return {
        who: sts.array(() => AccountId32),
    }
})

/**
 * Transfer some liquid free balance to another account.
 * 
 * `transfer_allow_death` will set the `FreeBalance` of the sender and receiver.
 * If the sender's account is below the existential deposit as a result
 * of the transfer, the account will be reaped.
 * 
 * The dispatch origin for this call must be `Signed` by the transactor.
 */
export type BalancesTransferAllowDeathCall = {
    dest: MultiAddress,
    value: bigint,
}

export const BalancesTransferAllowDeathCall: sts.Type<BalancesTransferAllowDeathCall> = sts.struct(() => {
    return {
        dest: MultiAddress,
        value: sts.bigint(),
    }
})

/**
 * Set the regular balance of a given account; it also takes a reserved balance but this
 * must be the same as the account's current reserved balance.
 * 
 * The dispatch origin for this call is `root`.
 * 
 * WARNING: This call is DEPRECATED! Use `force_set_balance` instead.
 */
export type BalancesSetBalanceDeprecatedCall = {
    who: MultiAddress,
    newFree: bigint,
    oldReserved: bigint,
}

export const BalancesSetBalanceDeprecatedCall: sts.Type<BalancesSetBalanceDeprecatedCall> = sts.struct(() => {
    return {
        who: MultiAddress,
        newFree: sts.bigint(),
        oldReserved: sts.bigint(),
    }
})

/**
 * Set the regular balance of a given account.
 * 
 * The dispatch origin for this call is `root`.
 */
export type BalancesForceSetBalanceCall = {
    who: MultiAddress,
    newFree: bigint,
}

export const BalancesForceSetBalanceCall: sts.Type<BalancesForceSetBalanceCall> = sts.struct(() => {
    return {
        who: MultiAddress,
        newFree: sts.bigint(),
    }
})

/**
 * An account was upgraded.
 */
export type BalancesUpgradedEvent = {
    who: AccountId32,
}

export const BalancesUpgradedEvent: sts.Type<BalancesUpgradedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
    }
})

/**
 * Some balance was unlocked.
 */
export type BalancesUnlockedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesUnlockedEvent: sts.Type<BalancesUnlockedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was thawed.
 */
export type BalancesThawedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesThawedEvent: sts.Type<BalancesThawedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was suspended from an account (it can be restored later).
 */
export type BalancesSuspendedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesSuspendedEvent: sts.Type<BalancesSuspendedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was restored into an account.
 */
export type BalancesRestoredEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesRestoredEvent: sts.Type<BalancesRestoredEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Total issuance was decreased by `amount`, creating a debt to be balanced.
 */
export type BalancesRescindedEvent = {
    amount: bigint,
}

export const BalancesRescindedEvent: sts.Type<BalancesRescindedEvent> = sts.struct(() => {
    return {
        amount: sts.bigint(),
    }
})

/**
 * Some amount was minted into an account.
 */
export type BalancesMintedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesMintedEvent: sts.Type<BalancesMintedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was locked.
 */
export type BalancesLockedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesLockedEvent: sts.Type<BalancesLockedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Total issuance was increased by `amount`, creating a credit to be balanced.
 */
export type BalancesIssuedEvent = {
    amount: bigint,
}

export const BalancesIssuedEvent: sts.Type<BalancesIssuedEvent> = sts.struct(() => {
    return {
        amount: sts.bigint(),
    }
})

/**
 * Some balance was frozen.
 */
export type BalancesFrozenEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesFrozenEvent: sts.Type<BalancesFrozenEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was burned from an account.
 */
export type BalancesBurnedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesBurnedEvent: sts.Type<BalancesBurnedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A balance was set by root.
 */
export type BalancesBalanceSetEvent = {
    who: AccountId32,
    free: bigint,
}

export const BalancesBalanceSetEvent: sts.Type<BalancesBalanceSetEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        free: sts.bigint(),
    }
})
