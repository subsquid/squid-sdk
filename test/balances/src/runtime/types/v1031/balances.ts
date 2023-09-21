import {sts} from '../../pallet.support'
import {AccountId, Balance} from './types'

/**
 *  An account was reaped.
 */
export type BalancesReapedAccountEvent = [AccountId, Balance]

export const BalancesReapedAccountEvent: sts.Type<BalancesReapedAccountEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  A balance was set by root (who, free, reserved).
 */
export type BalancesBalanceSetEvent = [AccountId, Balance, Balance]

export const BalancesBalanceSetEvent: sts.Type<BalancesBalanceSetEvent> = sts.tuple(() => AccountId, Balance, Balance)
