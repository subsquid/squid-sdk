import {sts} from '../../pallet.support'
import {AccountId, Balance} from './types'

/**
 *  Some amount was deposited (e.g. for transaction fees).
 */
export type BalancesDepositEvent = [AccountId, Balance]

export const BalancesDepositEvent: sts.Type<BalancesDepositEvent> = sts.tuple(() => [AccountId, Balance])
