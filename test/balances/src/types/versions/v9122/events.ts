import * as sts from '@subsquid/substrate-runtime/lib/sts'

/**
 * Some amount was removed from the account (e.g. for misbehavior). \[who,
 * amount_slashed\]
 */
export const BalancesSlashedEvent = sts.tuple(AccountId32, Type_6)

export type BalancesSlashedEvent = sts.GetType<typeof BalancesSlashedEvent>

/**
 * Some amount was withdrawn from the account (e.g. for transaction fees). \[who, value\]
 */
export const BalancesWithdrawEvent = sts.tuple(AccountId32, Type_6)

export type BalancesWithdrawEvent = sts.GetType<typeof BalancesWithdrawEvent>
