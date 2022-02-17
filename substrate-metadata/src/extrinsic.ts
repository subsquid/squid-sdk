import {Codec, Src} from "@subsquid/scale-codec"
import assert from "assert"
import {ChainDescription} from "./chainDescription"


export interface ExtrinsicSignature {
    address: any
    signature: any
    signedExtensions: any
}


export interface Extrinsic {
    call: any
    signature?: ExtrinsicSignature
}


export function decodeExtrinsic(
    rawExtrinsic: string | Uint8Array,
    chainDescription: ChainDescription,
    codec?: Codec
): Extrinsic {
    codec = codec || new Codec(chainDescription.types)

    let src = new Src(rawExtrinsic)
    src.compact()

    let meta = src.u8()
    let signed = meta & 0b10000000
    let version = meta & 0b01111111

    assert(version == 4, 'unsupported extrinsic version')

    if (signed) {
        let signature = codec.decode(chainDescription.signature, src)
        let call = codec.decode(chainDescription.call, src)
        return {
            signature,
            call
        }
    } else {
        return {
            call: codec.decode(chainDescription.call, src)
        }
    }
}
