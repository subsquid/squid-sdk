import {Bytes} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'
import {Event, EventType} from './types'


const EvmLogType: sts.Type<EvmLog> = sts.struct({
    address: sts.bytes(),
    data: sts.bytes(),
    topics: sts.array(sts.bytes)
})


const EvmLogEventLegacy = new EventType(EvmLogType)
const EvmLogEventLatest = new EventType(sts.struct({log: EvmLogType}))


export interface EvmLog {
    address: Bytes
    data: Bytes
    topics: Bytes[]
}


export function getEvmLog(event: Event): EvmLog {
    assert(event.name === 'EVM.Log')
    if (EvmLogEventLegacy.is(event)) {
        return EvmLogEventLegacy.decode(event)
    } else {
        return EvmLogEventLatest.decode(event).log
    }
}
