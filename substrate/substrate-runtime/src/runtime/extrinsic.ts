import {ByteSink, Codec, Sink, Src} from '@subsquid/scale-codec'
import assert from 'assert'
import type {RuntimeDescription} from '../metadata'
import {Extrinsic} from './interfaces'


export function decodeExtrinsic(
    rawExtrinsic: string | Uint8Array,
    runtimeDescription: RuntimeDescription,
    codec?: Codec
): Extrinsic {
    codec = codec || new Codec(runtimeDescription.types)

    let src = new Src(rawExtrinsic)
    src.compact()

    let meta = src.u8()
    let signed = meta & 0b10000000
    let version = meta & 0b01111111

    assert(version == 4, 'unsupported extrinsic version')

    if (signed) {
        let signature = codec.decode(runtimeDescription.signature, src)
        let call = codec.decode(runtimeDescription.call, src)
        return {
            version: 4,
            signature,
            call
        }
    } else {
        return {
            version: 4,
            call: codec.decode(runtimeDescription.call, src)
        }
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
