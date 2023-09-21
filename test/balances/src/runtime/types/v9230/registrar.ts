import {sts} from '../../pallet.support'
import {Id, AccountId32} from './types'

export type RegistrarReservedEvent = {
    paraId: Id,
    who: AccountId32,
}

export const RegistrarReservedEvent: sts.Type<RegistrarReservedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
        who: AccountId32,
    }
})

export type RegistrarRegisteredEvent = {
    paraId: Id,
    manager: AccountId32,
}

export const RegistrarRegisteredEvent: sts.Type<RegistrarRegisteredEvent> = sts.struct(() => {
    return  {
        paraId: Id,
        manager: AccountId32,
    }
})

export type RegistrarDeregisteredEvent = {
    paraId: Id,
}

export const RegistrarDeregisteredEvent: sts.Type<RegistrarDeregisteredEvent> = sts.struct(() => {
    return  {
        paraId: Id,
    }
})
