import {Bytes} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'
import {Event, EventRecord} from './types'


const EvmLogType: sts.Type<EvmLog> = sts.struct({
    address: sts.bytes(),
    data: sts.bytes(),
    topics: sts.array(sts.bytes)
})


const EvmLogEventLegacy = new Event(EvmLogType)
const EvmLogEventLatest = new Event(sts.struct({log: EvmLogType}))


export interface EvmLog {
    address: Bytes
    data: Bytes
    topics: Bytes[]
}


export function getEvmLog(event: EventRecord): EvmLog {
    assert(event.name === 'EVM.Log')
    if (EvmLogEventLegacy.is(event)) {
        return EvmLogEventLegacy.decode(event)
    } else {
        return EvmLogEventLatest.decode(event).log
    }
}
