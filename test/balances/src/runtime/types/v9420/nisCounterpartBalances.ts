import {sts} from '../../pallet.support'
import {AccountId32, MultiAddress} from './types'

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
export type NisCounterpartBalancesUpgradeAccountsCall = {
    who: AccountId32[],
}

export const NisCounterpartBalancesUpgradeAccountsCall: sts.Type<NisCounterpartBalancesUpgradeAccountsCall> = sts.struct(() => {
    return  {
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
export type NisCounterpartBalancesTransferAllowDeathCall = {
    dest: MultiAddress,
    value: bigint,
}

export const NisCounterpartBalancesTransferAllowDeathCall: sts.Type<NisCounterpartBalancesTransferAllowDeathCall> = sts.struct(() => {
    return  {
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
export type NisCounterpartBalancesSetBalanceDeprecatedCall = {
    who: MultiAddress,
    newFree: bigint,
    oldReserved: bigint,
}

export const NisCounterpartBalancesSetBalanceDeprecatedCall: sts.Type<NisCounterpartBalancesSetBalanceDeprecatedCall> = sts.struct(() => {
    return  {
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
export type NisCounterpartBalancesForceSetBalanceCall = {
    who: MultiAddress,
    newFree: bigint,
}

export const NisCounterpartBalancesForceSetBalanceCall: sts.Type<NisCounterpartBalancesForceSetBalanceCall> = sts.struct(() => {
    return  {
        who: MultiAddress,
        newFree: sts.bigint(),
    }
})

/**
 * An account was upgraded.
 */
export type NisCounterpartBalancesUpgradedEvent = {
    who: AccountId32,
}

export const NisCounterpartBalancesUpgradedEvent: sts.Type<NisCounterpartBalancesUpgradedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
    }
})

/**
 * Some balance was unlocked.
 */
export type NisCounterpartBalancesUnlockedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesUnlockedEvent: sts.Type<NisCounterpartBalancesUnlockedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was thawed.
 */
export type NisCounterpartBalancesThawedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesThawedEvent: sts.Type<NisCounterpartBalancesThawedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was suspended from an account (it can be restored later).
 */
export type NisCounterpartBalancesSuspendedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesSuspendedEvent: sts.Type<NisCounterpartBalancesSuspendedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was restored into an account.
 */
export type NisCounterpartBalancesRestoredEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesRestoredEvent: sts.Type<NisCounterpartBalancesRestoredEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Total issuance was decreased by `amount`, creating a debt to be balanced.
 */
export type NisCounterpartBalancesRescindedEvent = {
    amount: bigint,
}

export const NisCounterpartBalancesRescindedEvent: sts.Type<NisCounterpartBalancesRescindedEvent> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
    }
})

/**
 * Some amount was minted into an account.
 */
export type NisCounterpartBalancesMintedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesMintedEvent: sts.Type<NisCounterpartBalancesMintedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was locked.
 */
export type NisCounterpartBalancesLockedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesLockedEvent: sts.Type<NisCounterpartBalancesLockedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Total issuance was increased by `amount`, creating a credit to be balanced.
 */
export type NisCounterpartBalancesIssuedEvent = {
    amount: bigint,
}

export const NisCounterpartBalancesIssuedEvent: sts.Type<NisCounterpartBalancesIssuedEvent> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
    }
})

/**
 * Some balance was frozen.
 */
export type NisCounterpartBalancesFrozenEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesFrozenEvent: sts.Type<NisCounterpartBalancesFrozenEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was burned from an account.
 */
export type NisCounterpartBalancesBurnedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const NisCounterpartBalancesBurnedEvent: sts.Type<NisCounterpartBalancesBurnedEvent> = sts.struct(() => {
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
}

export const NisCounterpartBalancesBalanceSetEvent: sts.Type<NisCounterpartBalancesBalanceSetEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        free: sts.bigint(),
    }
})
