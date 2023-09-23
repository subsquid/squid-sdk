import {sts} from '../../pallet.support'
import {AccountId, Balance} from './types'

/**
 *  Transfer succeeded (from, to, value, fees).
 */
export type BalancesTransferEvent = [AccountId, AccountId, Balance, Balance]

export const BalancesTransferEvent: sts.Type<BalancesTransferEvent> = sts.tuple(() => [AccountId, AccountId, Balance, Balance])
