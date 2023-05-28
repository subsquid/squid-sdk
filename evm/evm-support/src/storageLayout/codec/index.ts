import {unexpectedCase} from '@subsquid/util-internal'
import {Sink} from './sink'
import {Src} from './src'

export * from './sink'
export * from './src'

export type Elementary =
    | `bytes${number}`
    | 'int'
    | `int${8 | 16 | 32 | 64 | 128 | 256}`
    | 'uint'
    | `uint${8 | 16 | 32 | 64 | 128 | 256}`
    | 'address'
    | 'bool'
    | 'enum'
    | 'contract'
    | 'fixed'
    | `fixed${8 | 16 | 32 | 64 | 128 | 256}${number}`
    | 'ufixed'
    | `ufixed${8 | 16 | 32 | 64 | 128 | 256}${number}`

const typeBytes = new RegExp(/^bytes([0-9]*)$/)

// TODO: add support for "fixed" types, don't know what type it should take
export function encodeElementary(type: Elementary, val: any, sink: Sink): void {
    let match = type.match(typeBytes)
    if (match != null) {
        sink.bytes(val, Number(match[1]))
    }

    switch (type) {
        case 'int8':
            sink.i8(val)
            break
        case 'uint8':
        case 'enum':
            sink.u8(val)
            break
        case 'int16':
            sink.i16(val)
            break
        case 'uint16':
            sink.u16(val)
            break
        case 'int32':
            sink.i32(val)
            break
        case 'uint32':
            sink.u32(val)
            break
        case 'int64':
            sink.i64(val)
            break
        case 'uint64':
            sink.u64(val)
            break
        case 'int128':
            sink.i128(val)
            break
        case 'uint128':
            sink.u128(val)
            break
        case 'int256':
        case 'int':
            sink.i256(val)
            break
        case 'uint256':
        case 'uint':
            sink.u256(val)
            break
        case 'bool':
            sink.bool(val)
            break
        case 'address':
        case 'contract':
            sink.address(val)
            break
        default:
            throw unexpectedCase(type)
    }
}

// TODO: add support for "fixed" types, don't know what type it should return
export function decodeElementary(type: Elementary, src: Src): any {
    let match = type.match(typeBytes)
    if (match != null) {
        src.bytes(Number(match[1]))
    }

    switch (type) {
        case 'int8':
            return src.i8()
        case 'uint8':
        case 'enum':
            return src.u8()
        case 'int16':
            return src.i16()
        case 'uint16':
            return src.u16()
        case 'int32':
            return src.i32()
        case 'uint32':
            return src.u32()
        case 'int64':
            return src.i64()
        case 'uint64':
            return src.u64()
        case 'int128':
            return src.i128()
        case 'uint128':
            return src.u128()
        case 'int256':
        case 'int':
            return src.i256()
        case 'uint256':
        case 'uint':
            return src.u256()
        case 'bool':
            return src.bool()
        case 'address':
        case 'contract':
            return src.address()
        default:
            throw unexpectedCase(type)
    }
}
