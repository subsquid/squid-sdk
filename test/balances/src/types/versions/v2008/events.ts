import * as sts from '@subsquid/substrate-runtime/lib/sts'

/**
 *  Some balance was moved from the reserve of the first account to the second account.
 *  Final argument indicates the destination balance type.
 */
export const BalancesReserveRepatriatedEvent = sts.tuple(AccountId, AccountId, Balance, BalanceStatus)

export type BalancesReserveRepatriatedEvent = sts.GetType<typeof BalancesReserveRepatriatedEvent>

/**
 *  Some balance was reserved (moved from free to reserved).
 */
export const BalancesReservedEvent = sts.tuple(AccountId, Balance)

export type BalancesReservedEvent = sts.GetType<typeof BalancesReservedEvent>

/**
 *  Some balance was unreserved (moved from reserved to free).
 */
export const BalancesUnreservedEvent = sts.tuple(AccountId, Balance)

export type BalancesUnreservedEvent = sts.GetType<typeof BalancesUnreservedEvent>
