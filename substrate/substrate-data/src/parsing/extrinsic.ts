import {Bytes, CallRecord, Runtime} from '@subsquid/substrate-runtime'
import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import blake2b from 'blake2b'
import {Extrinsic} from '../interfaces/data'


export interface DecodedExtrinsic {
    extrinsic: Extrinsic
    call: CallRecord
}


export function decodeExtrinsics(
    runtime: Runtime,
    extrinsics: Bytes[],
    withHash: boolean
): DecodedExtrinsic[] {
    return extrinsics.map((hex, index) => {
        let bytes = decodeHex(hex)
        let src = runtime.decodeExtrinsic(bytes)

        let extrinsic: Extrinsic = {
            index,
            version: src.version
        }

        if (src.signature) {
            extrinsic.signature = src.signature
        }

        if (withHash) {
            extrinsic.hash = toHex(blake2b(32).update(bytes).digest())
        }

        let call = runtime.toCallRecord(src.call)

        return {extrinsic, call}
    })
}
