import {Codec, Src, Ti} from "@subsquid/scale-codec"
import assert from "assert"
import {Metadata} from "./interfaces"
import * as metadataDefinition from "./old/definitions/metadata"
import {OldTypeRegistry} from "./old/typeRegistry"


const {codec, versions} = createScaleCodec()


export function decodeMetadata(data: string | Uint8Array): Metadata {
    if (typeof data == 'string') {
        data = Buffer.from(data.slice(2), 'hex')
    }
    let src = new Src(data)

    let magic = src.u32()
    assert(magic === 0x6174656d, 'No magic number 0x6174656d at the start of data')

    let version = src.u8()
    assert(9 <= version && version < 15, 'Invalid metadata version')

    // See https://github.com/polkadot-js/api/commit/a9211690be6b68ad6c6dad7852f1665cadcfa5b2
    // for why try-catch and version decoding stuff is here
    try {
        return decode(version, src)
    } catch(e: any) {
        if (version != 9) throw e
        try {
            src = new Src(data)
            src.u32()
            src.u8()
            return decode(10, src)
        } catch(anotherError: any) {
            throw e
        }
    }
}


function decode(version: Ti, src: Src): Metadata {
    let metadata = codec.decode(versions[version-9], src)
    src.assertEOF()
    return {
        __kind: `V${version}` as any,
        value: metadata
    }
}


function createScaleCodec(): {codec: Codec, versions: Ti[]} {
    let registry = new OldTypeRegistry(metadataDefinition)
    let versions: Ti[] = new Array(6)
    for (let i = 9; i < 15; i++) {
        versions[i-9] = registry.use(`MetadataV${i}`)
    }
    return {
        codec: new Codec(registry.getTypes()),
        versions
    }
}
