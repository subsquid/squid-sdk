import {ByteSink, Codec, Sink, Src} from '@subsquid/scale-codec'
import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import type {RuntimeDescription} from '../metadata'
import {Extrinsic} from './interfaces'


enum Preamble {
    Bare = 0,
    Signed = 128,
}


export function decodeExtrinsic(
    rawExtrinsic: string | Uint8Array,
    runtimeDescription: RuntimeDescription,
    codec?: Codec
): Extrinsic {
    codec = codec || new Codec(runtimeDescription.types)

    let src = new Src(rawExtrinsic)
    src.compact()

    let meta = src.u8()
    let version = meta & 0b01111111
    assert([4, 5].includes(version), 'unsupported extrinsic version')

    let preamble = meta & 0b11000000
    switch (preamble) {
        case Preamble.Bare:
            return {
                version,
                call: codec.decode(runtimeDescription.call, src)
            }
        case Preamble.Signed:
            assert(version == 4, 'signed extrinsics only supported for v4');
            return {
                version,
                signature: codec.decode(runtimeDescription.signature, src),
                call: codec.decode(runtimeDescription.call, src)
            }
        default:
            throw unexpectedCase(preamble)
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
        meta |= 0b10000000
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
