import {unexpectedCase} from '@subsquid/util-internal'
import {Sink} from './sink'
import {Src} from './src'

export type Elementary =
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
const typeInt = new RegExp(/^(u?int)([0-9]*)$/)
const typeEnum = new RegExp(/^enum (.+)$/)
const typeContract = new RegExp(/^contract (.+)$/)

// TODO: add support for "fixed" types
export function encodeElementary(type: Elementary, val: any, sink: Sink): void {
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

export function decodeElementary(type: Elementary, src: Src): void {
    switch (type) {
        case 'int8':
            src.i8()
            break
        case 'uint8':
        case 'enum':
            src.u8()
            break
        case 'int16':
            src.i16()
            break
        case 'uint16':
            src.u16()
            break
        case 'int32':
            src.i32()
            break
        case 'uint32':
            src.u32()
            break
        case 'int64':
            src.i64()
            break
        case 'uint64':
            src.u64()
            break
        case 'int128':
            src.i128()
            break
        case 'uint128':
            src.u128()
            break
        case 'int256':
        case 'int':
            src.i256()
            break
        case 'uint256':
        case 'uint':
            src.u256()
            break
        case 'bool':
            src.bool()
            break
        case 'address':
        case 'contract':
            src.str()
            break
        default:
            throw unexpectedCase(type)
    }
}
