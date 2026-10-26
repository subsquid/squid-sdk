import {ByteSink, Codec, Sink, Src} from '@subsquid/scale-codec'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import type {RuntimeDescription} from '../metadata'
import {Extrinsic} from './interfaces'


const VERSION_MASK = 0b00111111
const TYPE_MASK = 0b11000000

const EXTRINSIC_TYPE_BARE = 0b00000000
const EXTRINSIC_TYPE_GENERAL = 0b01000000
const EXTRINSIC_TYPE_SIGNED = 0b10000000


export function decodeExtrinsic(
    rawExtrinsic: string | Uint8Array,
    runtimeDescription: RuntimeDescription,
    codec?: Codec
): Extrinsic {
    codec = codec || new Codec(runtimeDescription.types)

    let src = new Src(rawExtrinsic)
    src.compact()

    let meta = src.u8()
    let version = meta & VERSION_MASK
    assert([4, 5].includes(version), 'unsupported extrinsic version')

    let type = meta & TYPE_MASK
    switch (type) {
        case EXTRINSIC_TYPE_BARE:
            return {
                version,
                call: codec.decode(runtimeDescription.call, src)
            }
        case EXTRINSIC_TYPE_SIGNED:
            assert(version == 4, 'signed extrinsics only supported for v4')
            return {
                version,
                signature: codec.decode(runtimeDescription.signature, src),
                call: codec.decode(runtimeDescription.call, src)
            }
        case EXTRINSIC_TYPE_GENERAL: {
            assert(version == 5, 'general extrinsics only supported for v5')
            let extensionVersion = src.u8()
            let generalExtensions = assertNotNull(
                runtimeDescription.generalExtensionsByVersion?.[extensionVersion],
                `transaction extension version ${extensionVersion} is not described by the runtime metadata`
            )
            let extensions = codec.decode(generalExtensions, src)
            let call = codec.decode(runtimeDescription.call, src)
            return {
                version,
                extensionVersion,
                extensions,
                call
            }
        }
        default:
            throw unexpectedCase(type)
    }
}


export function encodeExtrinsic(
    extrinsic: Extrinsic,
    runtimeDescription: RuntimeDescription,
    codec?: Codec
): Uint8Array {
    assert(extrinsic.version == 4, 'unsupported extrinsic version')
    codec = codec || new Codec(runtimeDescription.types)
    let sink = new ByteSink()

    let meta = 4
    if (extrinsic.signature) {
        meta |= EXTRINSIC_TYPE_SIGNED
    }

    sink.u8(meta)
    if (extrinsic.signature) {
        codec.encode(runtimeDescription.signature, extrinsic.signature, sink)
    }
    codec.encode(runtimeDescription.call, extrinsic.call, sink)

    let bytes = sink.toBytes()
    sink = new ByteSink()
    sink.compact(bytes.length)
    sink.bytes(bytes)
    return sink.toBytes()
}


function encodeToSink(
    sink: Sink,
    extrinsic: Extrinsic,
    chainDescription: RuntimeDescription,
    codec?: Codec
): void {
    assert(extrinsic.version == 4, 'unsupported extrinsic version')
    codec = codec || new Codec(chainDescription.types)

    let meta = 4
    if (extrinsic.signature) {
        meta |= 0b10000000
    }

    sink.u8(meta)
    if (extrinsic.signature) {
        codec.encode(chainDescription.signature, extrinsic.signature, sink)
    }
    codec.encode(chainDescription.call, extrinsic.call, sink)
}
