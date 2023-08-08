import {decodeHex, isHex} from '@subsquid/util-internal-hex'
import {toJSON} from '@subsquid/util-internal-json'
import assert from 'assert'
import {ArrayType, OptionType, Primitive, SequenceType, Ti, TupleType, Type, TypeKind} from './types'
import {CodecStructType, CodecType, CodecVariantType, toCodecTypes} from './types-codec'
import {checkSignedInt, checkUnsignedInt, isObject, throwUnexpectedCase, toSignedBigInt, toUnsignedBigInt} from './util'


export class JsonCodec {
    static encode(val: unknown): any {
        return toJSON(val)
    }

    private types: CodecType[]

    constructor(types: Type[]) {
        this.types = toCodecTypes(types)
    }

    decode(type: Ti, val: unknown): any {
        let def = this.types[type]
        switch(def.kind) {
            case TypeKind.Primitive:
                return decodePrimitive(def.primitive, val)
            case TypeKind.Compact:
                return decodePrimitive(def.integer, val)
            case TypeKind.BitSequence:
                return decodeHex(val as string)
            case TypeKind.Array:
                return this.decodeArray(def, val)
            case TypeKind.Sequence:
                return this.decodeSequence(def, val)
            case TypeKind.Tuple:
                return this.decodeTuple(def, val)
            case TypeKind.Struct:
                return this.decodeStruct(def, val)
            case TypeKind.Variant:
                return this.decodeVariant(def, val)
            case TypeKind.Option:
                return this.decodeOption(def, val)
            case TypeKind.BooleanOption:
                return decodeBooleanOption(val)
            case TypeKind.Bytes:
                return decodeHex(val as string)
            case TypeKind.BytesArray:
                return decodeBinaryArray(def.len, val)
            case TypeKind.HexBytes:
            case TypeKind.HexBytesArray:
                assert(isHex(val))
                return val
            case TypeKind.DoNotConstruct:
                throwUnexpectedCase('DoNotConstruct type reached')
            default:
                throwUnexpectedCase()
        }
    }

    private decodeArray(def: ArrayType, val: unknown): any[] {
        let {len, type} = def
        assert(Array.isArray(val))
        assert(val.length == len)
        let result = new Array(len)
        for (let i = 0; i < len; i++) {
            result[i] = this.decode(type, val[i])
        }
        return result
    }

    private decodeSequence(def: SequenceType, val: unknown): any[] {
        assert(Array.isArray(val))
        let result = new Array(val.length)
        for (let i = 0; i < val.length; i++) {
            result[i] = this.decode(def.type, val[i])
        }
        return result
    }

    private decodeTuple(def: TupleType, value: unknown): any {
        let items = def.tuple
        if (items.length == 0) {
            assert(value == null || Array.isArray(value) && value.length == 0)
            return null
        } else {
            assert(Array.isArray(value))
            assert(value.length == items.length)
            let result: any[] = new Array(items.length)
            for (let i = 0; i < items.length; i++) {
                result[i] = this.decode(items[i], value[i])
            }
            return result
        }
    }

    private decodeStruct(def: CodecStructType, value: any): any {
        assert(isObject(value))
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            result[f.name] = this.decode(f.type, value[f.name])
        }
        return result
    }

    private decodeVariant(def: CodecVariantType, val: any) {
        assert(isObject(val))
        assert(typeof val.__kind == 'string')
        let variant = def.variantsByName[val.__kind]
        if (variant == null) throw new Error(`Unknown variant ${val.__kind}`)
        switch(variant.kind) {
            case "empty":
                return {
                    __kind: val.__kind
                }
            case "value":
                return {
                    __kind: val.__kind,
                    value: this.decode(variant.type, val.value)
                }
            case "tuple":
                return {
                    __kind: val.__kind,
                    value: this.decodeTuple(variant.def, val.value)
                }
            case "struct": {
                let s = this.decodeStruct(variant.def, val)
                s.__kind = val.__kind
                return s
            }
            default:
                throwUnexpectedCase((variant as any).kind)
        }
    }

    private decodeOption(def: OptionType, value: unknown): any {
        return value == null ? undefined : this.decode(def.type, value)
    }
}


function decodePrimitive(type: Primitive, value: unknown): string | boolean | number | bigint {
    switch(type) {
        case "I8":
            checkSignedInt(value, 8)
            return value
        case "I16":
            checkSignedInt(value, 16)
            return value
        case "I32":
            checkSignedInt(value, 32)
            return value
        case "I64":
            return toSignedBigInt(value, 64)
        case "I128":
            return toSignedBigInt(value, 128)
        case "I256":
            return toSignedBigInt(value, 256)
        case "U8":
            checkUnsignedInt(value, 8)
            return value
        case "U16":
            checkUnsignedInt(value, 16)
            return value
        case "U32":
            checkUnsignedInt(value, 32)
            return value
        case "U64":
            return toUnsignedBigInt(value, 64)
        case "U128":
            return toUnsignedBigInt(value, 128)
        case "U256":
            return toUnsignedBigInt(value, 256)
        case "Bool":
            assert(typeof value == "boolean")
            return value
        case "Str":
            assert(typeof value == "string")
            return value
        default:
            throwUnexpectedCase(type)
    }
}


function decodeBooleanOption(value: unknown): boolean | undefined {
    if (value == null) return undefined
    assert(typeof value == 'boolean')
    return value
}


export function decodeBinaryArray(len: number, value: unknown): Uint8Array {
    let buf = decodeHex(value as string)
    assert(buf.length == len)
    return buf
}
