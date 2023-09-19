import * as sts from '@subsquid/substrate-runtime/lib/sts'

/**
 *  A balance was set by root (who, free, reserved).
 */
export const BalancesBalanceSetEvent = sts.tuple(AccountId, Balance, Balance)

export type BalancesBalanceSetEvent = sts.GetType<typeof BalancesBalanceSetEvent>

/**
 *  An account was reaped.
 */
export const BalancesReapedAccountEvent = sts.tuple(AccountId, Balance)

export type BalancesReapedAccountEvent = sts.GetType<typeof BalancesReapedAccountEvent>
