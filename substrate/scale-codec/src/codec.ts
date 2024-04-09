import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import {ByteSink, HexSink, Sink} from './sink'
import {Src} from './src'
import {
    ArrayType,
    BitSequence,
    Bytes,
    OptionType,
    Primitive,
    SequenceType,
    Ti,
    TupleType,
    Type,
    TypeKind
} from './types'
import {CodecCompactType, CodecStructType, CodecType, CodecVariantType, toCodecTypes} from './types-codec'
import {throwUnexpectedCase} from './util'


export class Codec {
    private types: CodecType[]

    constructor(types: Type[]) {
        this.types = toCodecTypes(types)
    }

    decodeBinary(type: Ti, data: Bytes | Uint8Array): any {
        let src = new Src(data)
        let val = this.decode(type, src)
        src.assertEOF()
        return val
    }

    encodeToHex(type: Ti, val: unknown): Bytes {
        let sink = new HexSink()
        this.encode(type, val, sink)
        return sink.toHex()
    }

    encodeToBinary(type: Ti, val: unknown): Uint8Array {
        let sink = new ByteSink()
        this.encode(type, val, sink)
        return sink.toBytes()
    }

    decode(type: Ti, src: Src): any {
        let def = this.types[type]
        switch(def.kind) {
            case TypeKind.Primitive:
                return decodePrimitive(def.primitive, src)
            case TypeKind.Compact:
                return decodeCompact(def, src)
            case TypeKind.BitSequence:
                return decodeBitSequence(src)
            case TypeKind.Array:
                return this.decodeArray(def, src)
            case TypeKind.Sequence:
                return this.decodeSequence(def, src)
            case TypeKind.Tuple:
                return this.decodeTuple(def, src)
            case TypeKind.Struct:
                return this.decodeStruct(def, src)
            case TypeKind.Variant:
                return this.decodeVariant(def, src)
            case TypeKind.Option:
                return this.decodeOption(def, src)
            case TypeKind.BooleanOption:
                return decodeBooleanOption(src)
            case TypeKind.Bytes:
                return decodeBytes(src)
            case TypeKind.BytesArray:
                return src.bytes(def.len)
            case TypeKind.HexBytes:
                return toHex(decodeBytes(src))
            case TypeKind.HexBytesArray:
                return toHex(src.bytes(def.len))
            case TypeKind.DoNotConstruct:
                throwUnexpectedCase('DoNotConstruct type reached')
            default:
                throwUnexpectedCase((def as Type).kind)
        }
    }

    private decodeArray(def: ArrayType, src: Src): any[] {
        let {len, type} = def
        let result: any[] = new Array(len)
        for (let i = 0; i < len; i++) {
            result[i] = this.decode(type, src)
        }
        return result
    }

    private decodeSequence(def: SequenceType, src: Src): any[] {
        let len = src.compactLength()
        let result: any[] = new Array(len)
        for (let i = 0; i < len; i++) {
            result[i] = this.decode(def.type, src)
        }
        return result
    }

    private decodeTuple(def: TupleType, src: Src): any[] | null {
        if (def.tuple.length == 0) return null
        let result: any[] = new Array(def.tuple.length)
        for (let i = 0; i < def.tuple.length; i++) {
            result[i] = this.decode(def.tuple[i], src)
        }
        return result
    }

    private decodeStruct(def: CodecStructType, src: Src): any {
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            result[f.name] = this.decode(f.type, src)
        }
        return result
    }

    private decodeVariant(def: CodecVariantType, src: Src) {
        let idx = src.u8()
        let variant = def.variants[idx]
        if (variant == null) throwUnexpectedCase(`unknown variant index: ${idx}`)
        switch(variant.kind) {
            case 'empty':
                return {
                    __kind: variant.name
                }
            case 'tuple':
                return {
                    __kind: variant.name,
                    value: this.decodeTuple(variant.def, src)
                }
            case 'value':
                return {
                    __kind: variant.name,
                    value: this.decode(variant.type, src)
                }
            case 'struct': {
                let value = this.decodeStruct(variant.def, src)
                value.__kind = variant.name
                return value
            }
            default:
                throwUnexpectedCase()
        }
    }

    private decodeOption(def: OptionType, src: Src) {
        let byte = src.u8()
        switch(byte) {
            case 0:
                return undefined
            case 1:
                return this.decode(def.type, src)
            default:
                throwUnexpectedCase(byte.toString())
        }
    }

    encode(type: Ti, val: any, sink: Sink): void {
        let def = this.types[type]
        switch(def.kind) {
            case TypeKind.Primitive:
                encodePrimitive(def.primitive, val, sink)
                break
            case TypeKind.Compact:
                sink.compact(val)
                break
            case TypeKind.BitSequence:
                encodeBitSequence(val, sink)
                break
            case TypeKind.Array:
                this.encodeArray(def, val, sink)
                break
            case TypeKind.Sequence:
                this.encodeSequence(def, val, sink)
                break
            case TypeKind.Tuple:
                this.encodeTuple(def, val, sink)
                break
            case TypeKind.Struct:
                this.encodeStruct(def, val, sink)
                break
            case TypeKind.Variant:
                this.encodeVariant(def, val, sink)
                break
            case TypeKind.BytesArray:
                encodeBytesArray(def, val, sink)
                break
            case TypeKind.HexBytesArray:
                encodeBytesArray(def, decodeHex(val), sink)
                break
            case TypeKind.Bytes:
                encodeBytes(val, sink)
                break
            case TypeKind.HexBytes:
                encodeBytes(decodeHex(val), sink)
                break
            case TypeKind.BooleanOption:
                encodeBooleanOption(val, sink)
                break
            case TypeKind.Option:
                this.encodeOption(def, val, sink)
                break
            default:
                throwUnexpectedCase(def.kind)
        }
    }

    private encodeArray(def: ArrayType, val: unknown, sink: Sink): void {
        assert(Array.isArray(val) && val.length == def.len)
        for (let i = 0; i < val.length; i++) {
            this.encode(def.type, val[i], sink)
        }
    }

    private encodeSequence(def: SequenceType, val: unknown, sink: Sink): void {
        assert(Array.isArray(val))
        sink.compact(val.length)
        for (let i = 0; i < val.length; i++) {
            this.encode(def.type, val[i], sink)
        }
    }

    private encodeTuple(def: TupleType, val: unknown, sink: Sink): void {
        if (def.tuple.length == 0) {
            assert(val == null)
            return
        }
        assert(Array.isArray(val) && def.tuple.length == val.length)
        for (let i = 0; i < val.length; i++) {
            this.encode(def.tuple[i], val[i], sink)
        }
    }

    private encodeStruct(def: CodecStructType, val: any, sink: Sink): void {
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            this.encode(f.type, val[f.name], sink)
        }
    }

    private encodeVariant(def: CodecVariantType, val: any, sink: Sink): void {
        assert(typeof val?.__kind == 'string', 'not a variant type value')
        let variant = def.variantsByName[val.__kind]
        if (variant == null) throw new Error(`Unknown variant: ${val.__kind}`)
        sink.u8(variant.index)
        switch(variant.kind) {
            case 'empty':
                break
            case 'value':
                this.encode(variant.type, val.value, sink)
                break
            case 'tuple':
                this.encodeTuple(variant.def, val.value, sink)
                break
            case 'struct':
                this.encodeStruct(variant.def, val, sink)
                break
            default:
                throwUnexpectedCase()
        }
    }

    private encodeOption(def: OptionType, val: unknown, sink: Sink): void {
        if (val === undefined) {
            sink.u8(0)
        } else {
            sink.u8(1)
            this.encode(def.type, val, sink)
        }
    }
}


function decodeBytes(src: Src): Uint8Array {
    let len = src.compactLength()
    return src.bytes(len)
}


function encodeBytes(val: unknown, sink: Sink): void {
    assert(val instanceof Uint8Array)
    sink.compact(val.length)
    sink.bytes(val)
}


function encodeBytesArray(def: {len: number}, val: unknown, sink: Sink): void {
    assert(val instanceof Uint8Array && val.length == def.len)
    sink.bytes(val)
}


function decodeBitSequence(src: Src): BitSequence {
    let bitLength = src.compactLength()
    let byteLength = Math.ceil(bitLength / 8)
    let bytes = src.bytes(byteLength)
    return {
        bytes,
        bitLength
    }
}


function encodeBitSequence(val: any, sink: Sink): void {
    assert(
        val &&
        typeof val == 'object' &&
        Number.isInteger(val.bitLength) &&
        val.bytes instanceof Uint8Array
    )
    let bits = val as BitSequence
    assert(Math.ceil(bits.bitLength / 8) == bits.bytes.length)
    sink.compact(bits.bitLength)
    sink.bytes(bits.bytes)
}


function decodeBooleanOption(src: Src): boolean | null {
    let byte = src.u8()
    switch(byte) {
        case 0:
            return null
        case 1:
            return true
        case 2:
            return false
        default:
            throwUnexpectedCase(byte.toString())
    }
}


function encodeBooleanOption(val: unknown, sink: Sink): void {
    if (val == null) {
        sink.u8(0)
    } else {
        assert(typeof val == 'boolean')
        sink.u8(val ? 1 : 2)
    }
}


function decodeCompact(type: CodecCompactType, src: Src): number | bigint {
    let n = src.compact()
    switch(type.integer) {
        case "U8":
        case "U16":
        case "U32":
            return n
        default:
            return BigInt(n)
    }
}


function decodePrimitive(type: Primitive, src: Src): any {
    switch(type) {
        case 'I8':
            return src.i8()
        case 'U8':
            return src.u8()
        case 'I16':
            return src.i16()
        case 'U16':
            return src.u16()
        case 'I32':
            return src.i32()
        case 'U32':
            return src.u32()
        case 'I64':
            return src.i64()
        case 'U64':
            return src.u64()
        case 'I128':
            return src.i128()
        case 'U128':
            return src.u128()
        case 'I256':
            return src.i256()
        case 'U256':
            return src.u256()
        case 'Bool':
            return src.bool()
        case 'Str':
            return src.str()
        default:
            throwUnexpectedCase(type)
    }
}


function encodePrimitive(type: Primitive, val: any, sink: Sink): void {
    switch(type) {
        case 'I8':
            sink.i8(val)
            break
        case 'U8':
            sink.u8(val)
            break
        case 'I16':
            sink.i16(val)
            break
        case 'U16':
            sink.u16(val)
            break
        case 'I32':
            sink.i32(val)
            break
        case 'U32':
            sink.u32(val)
            break
        case 'I64':
            sink.i64(val)
            break
        case 'U64':
            sink.u64(val)
            break
        case 'I128':
            sink.i128(val)
            break
        case 'U128':
            sink.u128(val)
            break
        case 'I256':
            sink.i256(val)
            break
        case 'U256':
            sink.u256(val)
            break
        case 'Bool':
            sink.bool(val)
            break
        case 'Str':
            sink.str(val)
            break
        default:
            throwUnexpectedCase(type)
    }
}
