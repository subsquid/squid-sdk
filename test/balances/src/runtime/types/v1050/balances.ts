import {sts} from '../../pallet.support'
import {AccountId, Balance} from './types'

/**
 *  Transfer succeeded (from, to, value).
 */
export type BalancesTransferEvent = [AccountId, AccountId, Balance]

export const BalancesTransferEvent: sts.Type<BalancesTransferEvent> = sts.tuple(() => AccountId, AccountId, Balance)
