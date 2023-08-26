import {DecodedCall, Runtime} from '@subsquid/substrate-runtime'
import {Call, Event, Extrinsic} from '../../interfaces/data'
import {CallParser} from './parser'


export function parseCalls(
    runtime: Runtime,
    extrinsics: {extrinsic: Extrinsic, call: DecodedCall}[],
    events: Event[]
): Call[] {
    return new CallParser(runtime, extrinsics, events).parse()
}
