import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Some amount was withdrawn from the account (e.g. for transaction fees). \[who, value\]
 */
export type BalancesWithdrawEvent = [AccountId32, bigint]

export const BalancesWithdrawEvent: sts.Type<BalancesWithdrawEvent> = sts.tuple(() => [AccountId32, sts.bigint()])

/**
 * Some amount was removed from the account (e.g. for misbehavior). \[who,
 * amount_slashed\]
 */
export type BalancesSlashedEvent = [AccountId32, bigint]

export const BalancesSlashedEvent: sts.Type<BalancesSlashedEvent> = sts.tuple(() => [AccountId32, sts.bigint()])
