import {assertNotNull} from '@subsquid/util-internal'
import {Call, Event} from '../../interfaces/data'
import {RawBlock} from '../../interfaces/data-raw'
import {DecodedExtrinsic} from '../extrinsic'
import {CallParser} from './parser'


export function parseCalls(
    block: RawBlock,
    extrinsics: DecodedExtrinsic[],
    events: Event[]
): Call[] {
    return new CallParser(
        assertNotNull(block.runtime),
        block,
        extrinsics,
        events
    ).parse()
}
