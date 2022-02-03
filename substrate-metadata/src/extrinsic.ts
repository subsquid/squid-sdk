import {Codec, Src} from "@subsquid/scale-codec"
import {ChainDescription} from "./chainDescription"
import {Extrinsic} from "./interfaces"

const BIT_SIGNED = 0b10000000;

export function decodeExtrinsic(rawExtrinsic: string, description: ChainDescription): Extrinsic {
    let data = Buffer.from(rawExtrinsic.slice(2), 'hex')
    let src = new Src(data)
    let codec = new Codec(description.types)

    src.compact()
    let signed = (src.u8() & BIT_SIGNED) == BIT_SIGNED
    if (signed) {
        return {
            signature: codec.decode(description.signature, src),
            call: codec.decode(description.call, src),
        }
    } else {
        return {
            call: codec.decode(description.call, src),
        }
    }
}
