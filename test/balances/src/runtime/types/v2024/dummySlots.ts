import {sts} from '../../pallet.support'
import {AccountId} from './types'

export type DummySlotsDummyEvent = [AccountId]

export const DummySlotsDummyEvent: sts.Type<DummySlotsDummyEvent> = sts.tuple(() => AccountId)
