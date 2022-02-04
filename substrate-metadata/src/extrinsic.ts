import {Codec, Src} from "@subsquid/scale-codec"
import {blake2AsHex} from "@polkadot/util-crypto"
import {ChainDescription} from "./chainDescription"
import {Extrinsic} from "./interfaces"

const BIT_SIGNED = 0b10000000;

export function decodeExtrinsic(rawExtrinsic: string, description: ChainDescription): Extrinsic {
    let data = Buffer.from(rawExtrinsic.slice(2), 'hex')
    let src = new Src(data)
    let codec = new Codec(description.types)
    let hash = blake2AsHex(data)

    src.compact()
    let signed = (src.u8() & BIT_SIGNED) == BIT_SIGNED
    if (signed) {
        return {
            signature: codec.decode(description.signature, src),
            call: codec.decode(description.call, src),
            hash,
        }
    } else {
        return {
            call: codec.decode(description.call, src),
            hash,
        }
    }
}
