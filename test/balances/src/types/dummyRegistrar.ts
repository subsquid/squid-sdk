import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Dummy: createEvent(
        'DummyRegistrar.Dummy',
        {
            v2024: DummyRegistrarDummyEvent,
        }
    ),
}

export default {events}
