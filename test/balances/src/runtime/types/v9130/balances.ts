import {sts} from '../../pallet.support'
import {AccountId32, BalanceStatus} from './types'

/**
 * Some amount was withdrawn from the account (e.g. for transaction fees).
 */
export type BalancesWithdrawEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesWithdrawEvent: sts.Type<BalancesWithdrawEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was unreserved (moved from reserved to free).
 */
export type BalancesUnreservedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesUnreservedEvent: sts.Type<BalancesUnreservedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Transfer succeeded.
 */
export type BalancesTransferEvent = {
    from: AccountId32,
    to: AccountId32,
    amount: bigint,
}

export const BalancesTransferEvent: sts.Type<BalancesTransferEvent> = sts.struct(() => {
    return {
        from: AccountId32,
        to: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was removed from the account (e.g. for misbehavior).
 */
export type BalancesSlashedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesSlashedEvent: sts.Type<BalancesSlashedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was reserved (moved from free to reserved).
 */
export type BalancesReservedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesReservedEvent: sts.Type<BalancesReservedEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some balance was moved from the reserve of the first account to the second account.
 * Final argument indicates the destination balance type.
 */
export type BalancesReserveRepatriatedEvent = {
    from: AccountId32,
    to: AccountId32,
    amount: bigint,
    destinationStatus: BalanceStatus,
}

export const BalancesReserveRepatriatedEvent: sts.Type<BalancesReserveRepatriatedEvent> = sts.struct(() => {
    return {
        from: AccountId32,
        to: AccountId32,
        amount: sts.bigint(),
        destinationStatus: BalanceStatus,
    }
})

/**
 * An account was created with some free balance.
 */
export type BalancesEndowedEvent = {
    account: AccountId32,
    freeBalance: bigint,
}

export const BalancesEndowedEvent: sts.Type<BalancesEndowedEvent> = sts.struct(() => {
    return {
        account: AccountId32,
        freeBalance: sts.bigint(),
    }
})

/**
 * An account was removed whose balance was non-zero but below ExistentialDeposit,
 * resulting in an outright loss.
 */
export type BalancesDustLostEvent = {
    account: AccountId32,
    amount: bigint,
}

export const BalancesDustLostEvent: sts.Type<BalancesDustLostEvent> = sts.struct(() => {
    return {
        account: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Some amount was deposited (e.g. for transaction fees).
 */
export type BalancesDepositEvent = {
    who: AccountId32,
    amount: bigint,
}

export const BalancesDepositEvent: sts.Type<BalancesDepositEvent> = sts.struct(() => {
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
    reserved: bigint,
}

export const BalancesBalanceSetEvent: sts.Type<BalancesBalanceSetEvent> = sts.struct(() => {
    return {
        who: AccountId32,
        free: sts.bigint(),
        reserved: sts.bigint(),
    }
})
