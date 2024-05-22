import {event} from '../abi.support'
import {SomeEvent as SomeEvent_} from './types'

export type SomeEvent = SomeEvent_

export const SomeEvent = event(
    {
        d8: '0x27dd96945bce1d5d',
    },
    SomeEvent_,
)
