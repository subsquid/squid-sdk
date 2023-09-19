import * as sts from '@subsquid/substrate-runtime/lib/sts'

/**
 *  An account was removed whose balance was non-zero but below ExistentialDeposit,
 *  resulting in an outright loss.
 */
export const BalancesDustLostEvent = sts.tuple(AccountId, Balance)

export type BalancesDustLostEvent = sts.GetType<typeof BalancesDustLostEvent>

/**
 *  An account was created with some free balance.
 */
export const BalancesEndowedEvent = sts.tuple(AccountId, Balance)

export type BalancesEndowedEvent = sts.GetType<typeof BalancesEndowedEvent>

/**
 *  Transfer succeeded (from, to, value).
 */
export const BalancesTransferEvent = sts.tuple(AccountId, AccountId, Balance)

export type BalancesTransferEvent = sts.GetType<typeof BalancesTransferEvent>
