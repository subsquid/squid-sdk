import {Codec, Src} from "@subsquid/scale-codec"
import * as definitions from "../old/definitions/xcm"
import {OldTypeRegistry} from "../old/typeRegistry"
import type {VersionedXcm} from "./interfaces"


const [TI, CODEC] = (() => {
    let registry = new OldTypeRegistry(definitions)
    let ti = registry.use('VersionedXcm')
    let types = registry.getTypes()
    let codec = new Codec(types)
    return [ti, codec]
})()


export function decodeXcm(bytes: string | Uint8Array): VersionedXcm {
    let src = new Src(bytes)
    return CODEC.decode(TI, src)
}


export function encodeXcm(msg: VersionedXcm): Uint8Array {
    return CODEC.encodeToBinary(TI, msg)
}
