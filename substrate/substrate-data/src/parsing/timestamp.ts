import {Runtime} from '@subsquid/substrate-runtime'
import {bigint, struct} from '@subsquid/substrate-runtime/lib/sts'
import {assertCall} from '../types/util'
import {DecodedExtrinsic} from './extrinsic'


const TimestampSet = struct({
    now: bigint()
})


export function getBlockTimestamp(runtime: Runtime, extrinsics: DecodedExtrinsic[]): number {
    for (let ex of extrinsics) {
        if (ex.call.name == 'Timestamp.set') {
            assertCall(runtime, TimestampSet, ex.call)
            return Number(ex.call.args.now)
        }
    }
    return 0
}
