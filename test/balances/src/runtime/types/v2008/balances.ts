import {sts} from '../../pallet.support'
import {AccountId, Balance, BalanceStatus} from './types'

/**
 *  Some balance was unreserved (moved from reserved to free).
 */
export type BalancesUnreservedEvent = [AccountId, Balance]

export const BalancesUnreservedEvent: sts.Type<BalancesUnreservedEvent> = sts.tuple(() => [AccountId, Balance])

/**
 *  Some balance was reserved (moved from free to reserved).
 */
export type BalancesReservedEvent = [AccountId, Balance]

export const BalancesReservedEvent: sts.Type<BalancesReservedEvent> = sts.tuple(() => [AccountId, Balance])

/**
 *  Some balance was moved from the reserve of the first account to the second account.
 *  Final argument indicates the destination balance type.
 */
export type BalancesReserveRepatriatedEvent = [AccountId, AccountId, Balance, BalanceStatus]

export const BalancesReserveRepatriatedEvent: sts.Type<BalancesReserveRepatriatedEvent> = sts.tuple(() => [AccountId, AccountId, Balance, BalanceStatus])
