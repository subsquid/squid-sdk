import {Runtime} from '@subsquid/substrate-runtime'
import {Call, Event} from '../../interfaces/data'
import {DecodedExtrinsic} from '../extrinsic'
import {CallParser} from './parser'


export function parseCalls(
    runtime: Runtime,
    extrinsics: DecodedExtrinsic[],
    events: Event[]
): Call[] {
    return new CallParser(runtime, extrinsics, events).parse()
}
