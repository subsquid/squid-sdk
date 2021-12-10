import assert from "assert"
import {getCamelCase, assertNotNull, unexpectedCase} from "@subsquid/util"
import {Src} from "./src"
import type {
    ArrayType,
    BytesArrayType,
    Field,
    OptionType,
    SequenceType,
    Ti,
    TupleType,
    Type,
    VariantType
} from "./types"
import {Primitive, TypeKind} from "./types"
import {normalizeTypes} from "./util"


export class Codec {
    private types: Type[]

    constructor(types: Type[]) {
        this.types = normalizeTypes(types)
    }

    decodeBinary(type: Ti, data: string | Uint8Array): any {
        if (typeof data == 'string') {
            data = Buffer.from(data.slice(2), 'hex')
        }
        let src = new Src(data)
        let val = this.decode(type, src)
        src.assertEOF()
        return val
    }

    decode(type: Ti, src: Src): any {
        let def = this.types[type]
        switch(def.kind) {
            case TypeKind.Primitive:
                return decodePrimitive(def.primitive, src)
            case TypeKind.Compact:
                return src.compact()
            case TypeKind.BitSequence:
                return decodeBitSequence(src)
            case TypeKind.Array:
                return this.decodeArray(def, src)
            case TypeKind.Sequence:
                return this.decodeSequence(def, src)
            case TypeKind.Tuple:
                return this.decodeTuple(def, src)
            case TypeKind.Composite:
                return this.decodeComposite(def, src)
            case TypeKind.Variant:
                return this.decodeVariant(def, src)
            case TypeKind.Option:
                return this.decodeOption(def, src)
            case TypeKind.BooleanOption:
                return decodeBooleanOption(src)
            case TypeKind.Bytes:
                return decodeBytes(src)
            case TypeKind.BytesArray:
                return decodeBytesArray(def, src)
            case TypeKind.DoNotConstruct:
                throw new Error('DoNotConstruct type reached')
            default:
                throw unexpectedCase((def as Type).kind)
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
        switch(def.tuple.length) {
            case 0:
                return null
            case 1:
                return this.decode(def.tuple[0], src)
            default:
                let result: any[] = new Array(def.tuple.length)
                for (let i = 0; i < def.tuple.length; i++) {
                    result[i] = this.decode(def.tuple[i], src)
                }
                return result
        }
    }

    private decodeComposite(def: {fields: Field[]}, src: Src): any {
        if (def.fields.length == 0) return null
        if (def.fields[0].name == null) return this.decodeCompositeTuple(def.fields, src)
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            let key = getCamelCase(assertNotNull(f.name))
            result[key] = this.decode(f.type, src)
        }
        return result
    }

    private decodeCompositeTuple(fields: Field[], src: Src): any {
        switch(fields.length) {
            case 0:
                return null
            case 1:
                assert(fields[0].name == null)
                return this.decode(fields[0].type, src)
            default: {
                let result: any = new Array(fields.length)
                for (let i = 0; i < fields.length; i++) {
                    let f = fields[i]
                    assert(f.name == null)
                    result[i] = this.decode(f.type, src)
                }
                return result
            }
        }
    }

    private decodeVariant(def: VariantType, src: Src) {
        let idx = src.u8()
        let variant = def.variants[idx]
        if (variant == null) {
            throw new Error('Unexpected variant index')
        }
        if (variant.fields.length == 0) {
            return {
                __kind: variant.name
            }
        }
        if (variant.fields[0].name == null) {
            return {
                __kind: variant.name,
                value: this.decodeCompositeTuple(variant.fields, src)
            }
        }
        let value = this.decodeComposite(variant, src)
        value.__kind = variant.name
        return value
    }

    private decodeOption(def: OptionType, src: Src) {
        let byte = src.u8()
        switch(byte) {
            case 0:
                return undefined
            case 1:
                return this.decode(def.type, src)
            default:
                throw unexpectedCase(byte.toString())
        }
    }
}


function decodeBytes(src: Src): Uint8Array {
    let len = src.compactLength()
    return src.bytes(len)
}


function decodeBitSequence(src: Src): Uint8Array {
    let len = Math.ceil(src.compactLength() / 8)
    return src.bytes(len)
}


function decodeBytesArray(def: BytesArrayType, src: Src): Uint8Array {
    return src.bytes(def.len)
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
            throw unexpectedCase(byte.toString())
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
            throw unexpectedCase(type)
    }
}
