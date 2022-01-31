// @ts-nocheck
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
        let signature = codec.decode(description.signature, src)
        let palletIndex = src.u8()
        console.log('palletIndex', palletIndex)
        codec.types[description.call].variants.forEach((variant) => {
            if (variant.index == palletIndex) {
                let callIndex = src.u8()
                let call = variant.fields[callIndex]
                codec.decode(call.type, src)
            }
        })
        return {
            signature,
            call: codec.decode(description.call, src),
        }
    } else {
        return {
            call: codec.decode(description.call, src),
        }
    }
}
