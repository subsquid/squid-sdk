import {sts} from '../../pallet.support'
import {Balance} from './types'

/**
 *  Some funds were deposited into the society account.
 */
export type SocietyDepositEvent = [Balance]

export const SocietyDepositEvent: sts.Type<SocietyDepositEvent> = sts.tuple(() => Balance)
