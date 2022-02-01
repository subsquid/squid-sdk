import assert from "assert"
import {CodecStructType, CodecType, CodecVariantType, toCodecTypes} from "./types-codec"
import {Src} from "./src"
import {ArrayType, OptionType, Primitive, SequenceType, Ti, TupleType, Type, TypeKind} from "./types"
import {throwUnexpectedCase} from "./util"


export class Codec {
    private types: CodecType[]

    constructor(types: Type[]) {
        this.types = toCodecTypes(types)
    }

    decodeBinary(type: Ti, data: string | Uint8Array): any {
        if (typeof data == 'string') {
            assert(/^0x([a-fA-F0-9]{2})+$/.test(data))
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
}


function decodeBytes(src: Src): Uint8Array {
    let len = src.compactLength()
    return src.bytes(len)
}


function decodeBitSequence(src: Src): Uint8Array {
    let len = Math.ceil(src.compactLength() / 8)
    return src.bytes(len)
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
