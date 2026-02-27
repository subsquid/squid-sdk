import {ByteSink, Codec, Sink, Src} from "@subsquid/scale-codec"
import assert from "assert"
import {unexpectedCase} from "@subsquid/util-internal"
import {ChainDescription} from "./chainDescription"

/**
 * Extrinsic preamble type - matches Polkadot SDK sp_runtime::generic::Preamble.
 * Upper 2 bits of the version byte determine the extrinsic type.
 */
enum Preamble {
    /** Inherent/unsigned extrinsic without signature or extension */
    Bare = 0b00000000,
    /** v5 extrinsic with transaction extensions (no inline signature) */
    General = 0b01000000,
    /** v4 signed extrinsic with address, signature, and extensions */
    Signed = 0b10000000,
}


export interface ExtrinsicSignature {
    address: any
    signature: any
    signedExtensions: any
}


export interface ExtrinsicExtension {
    /** Transaction extension format version (ExtensionVersion in Polkadot SDK) */
    version: number
    /** Decoded transaction extension data (signed extensions for user transactions) */
    extension: any
}

export interface Extrinsic {
    version: number
    call: any
    /** Present for Signed preamble (v4) */
    signature?: ExtrinsicSignature
    /** Present for General preamble (v5) */
    extension?: ExtrinsicExtension
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
    let version = meta & 0b01111111
    assert([4, 5].includes(version), 'unsupported extrinsic version')

    let preamble = meta & 0b11000000
    switch (preamble) {
        case Preamble.Bare:
            return {
                version,
                call: codec.decode(chainDescription.call, src)
            }
        case Preamble.Signed:
            assert(version == 4, 'signed extrinsics only supported for v4')
            return {
                version,
                signature: codec.decode(chainDescription.signature, src),
                call: codec.decode(chainDescription.call, src)
            }
        case Preamble.General:
            assert(version == 5, 'general extrinsics only supported for v5')
            assert(chainDescription.extension != null, 'chain description must include extension type for v5 extrinsics')
            return {
                version,
                extension: {
                    version: src.u8(),
                    extension: codec.decode(chainDescription.extension!, src)
                },
                call: codec.decode(chainDescription.call, src)
            }
        default:
            throw unexpectedCase(preamble)
    }
}

export function encodeExtrinsic(
    extrinsic: Extrinsic,
    chainDescription: ChainDescription,
    codec?: Codec
): Uint8Array {
    assert(extrinsic.version == 4, 'unsupported extrinsic version')
    codec = codec || new Codec(chainDescription.types)
    let sink = new ByteSink()

    let meta = 4
    if (extrinsic.signature) {
        meta |= 0b10000000
    }

    sink.u8(meta)
    if (extrinsic.signature) {
        codec.encode(chainDescription.signature, extrinsic.signature, sink)
    }
    codec.encode(chainDescription.call, extrinsic.call, sink)

    let bytes = sink.toBytes()
    sink = new ByteSink()
    sink.compact(bytes.length)
    sink.bytes(bytes)
    return sink.toBytes()
}


function encodeToSink(
    sink: Sink,
    extrinsic: Extrinsic,
    chainDescription: ChainDescription,
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
