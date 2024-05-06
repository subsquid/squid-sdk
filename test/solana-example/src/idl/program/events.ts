import {event} from '../idl.support'
import {SomeEventType as SomeEventType_, SomeEvent as SomeEvent_} from './types'

export type SomeEventType = SomeEventType_

export const SomeEvent = event(
    {
        d8: '0x27dd96945bce1d5d',
    },
    SomeEvent_,
)
