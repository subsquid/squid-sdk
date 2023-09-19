import * as sts from '@subsquid/substrate-runtime/lib/sts'

/**
 *  A new account was created.
 */
export const BalancesNewAccountEvent = sts.tuple(AccountId, Balance)

export type BalancesNewAccountEvent = [string, bigint]

/**
 *  An account was reaped.
 */
export const BalancesReapedAccountEvent = sts.bytes()

export type BalancesReapedAccountEvent = sts.GetType<typeof BalancesReapedAccountEvent>

/**
 *  Transfer succeeded (from, to, value, fees).
 */
export const BalancesTransferEvent = sts.tuple(AccountId, AccountId, Balance, Balance)

export type BalancesTransferEvent = sts.GetType<typeof BalancesTransferEvent>
