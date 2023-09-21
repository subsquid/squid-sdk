import {sts} from '../../pallet.support'

/**
 *  The maximum number of named reserves that can exist on an account.
 */
export type BalancesMaxReservesConstant = number

export const BalancesMaxReservesConstant: sts.Type<BalancesMaxReservesConstant> = sts.number()

/**
 *  The maximum number of locks that should exist on an account.
 *  Not strictly enforced, but used for weight estimation.
 */
export type BalancesMaxLocksConstant = number

export const BalancesMaxLocksConstant: sts.Type<BalancesMaxLocksConstant> = sts.number()
