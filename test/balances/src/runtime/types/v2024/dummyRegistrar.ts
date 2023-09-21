import {sts} from '../../pallet.support'
import {AccountId} from './types'

export type DummyRegistrarDummyEvent = [AccountId]

export const DummyRegistrarDummyEvent: sts.Type<DummyRegistrarDummyEvent> = sts.tuple(() => AccountId)
