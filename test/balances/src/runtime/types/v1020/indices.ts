import {sts} from '../../pallet.support'
import {AccountId, AccountIndex} from './types'

/**
 *  A new account index was assigned.
 * 
 *  This event is not triggered when an existing index is reassigned
 *  to another `AccountId`.
 */
export type IndicesNewAccountIndexEvent = [AccountId, AccountIndex]

export const IndicesNewAccountIndexEvent: sts.Type<IndicesNewAccountIndexEvent> = sts.tuple(() => AccountId, AccountIndex)
