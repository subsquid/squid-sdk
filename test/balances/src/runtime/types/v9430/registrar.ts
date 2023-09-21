import {sts} from '../../pallet.support'
import {Id} from './types'

export type RegistrarSwappedEvent = {
    paraId: Id,
    otherId: Id,
}

export const RegistrarSwappedEvent: sts.Type<RegistrarSwappedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
        otherId: Id,
    }
})
