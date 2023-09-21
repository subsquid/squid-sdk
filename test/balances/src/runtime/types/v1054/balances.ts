import {sts} from '../../pallet.support'
import {AccountId, BalanceLock, AccountData} from './types'

/**
 *  Any liquidity locks on some account balances.
 *  NOTE: Should only be accessed when setting, changing and freeing a lock.
 */
export type BalancesLocksStorage = [[AccountId], BalanceLock[]]

export const BalancesLocksStorage: sts.Type<BalancesLocksStorage> = sts.tuple([sts.tuple(() => [AccountId]), sts.array(() => BalanceLock)])

/**
 *  The balance of an account.
 * 
 *  NOTE: THIS MAY NEVER BE IN EXISTENCE AND YET HAVE A `total().is_zero()`. If the total
 *  is ever zero, then the entry *MUST* be removed.
 * 
 *  NOTE: This is only used in the case that this module is used to store balances.
 */
export type BalancesAccountStorage = [[AccountId], AccountData]

export const BalancesAccountStorage: sts.Type<BalancesAccountStorage> = sts.tuple([sts.tuple(() => [AccountId]), AccountData])
