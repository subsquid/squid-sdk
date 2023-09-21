import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v2024 from './types/v2024'

export const events = {
    Dummy: createEvent(
        'DummySlots.Dummy',
        {
            v2024: v2024.DummySlotsDummyEvent,
        }
    ),
}

export default {events}
