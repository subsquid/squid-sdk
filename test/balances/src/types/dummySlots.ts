import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Dummy: createEvent(
        'DummySlots.Dummy',
        {
            v2024: DummySlotsDummyEvent,
        }
    ),
}

export default {events}
