import {
    ArrayType,
    Field,
    Primitive,
    SequenceType,
    Ti,
    TupleType,
    Type,
    TypeKind,
    VariantType
} from "@subsquid/scale-codec"
import {assertNotNull, normalizeTypes, unexpectedCase} from "@subsquid/scale-codec/lib/util"
import * as ss58 from "@subsquid/ss58-codec"
import assert from "assert"


export class Codec {
    private types: Type[]

    constructor(types: Type[]) {
        this.types = normalizeTypes(types)
    }

    decode(type: Ti, value: unknown): any {
        let def = this.types[type]
        switch(def.kind) {
            case TypeKind.Primitive:
                return decodePrimitive(def.primitive, value)
            case TypeKind.Compact:
                return this.decodeCompact(def.type, value)
            case TypeKind.BitSequence:
                return decodeHex(value)
            case TypeKind.Array:
            case TypeKind.Sequence:
                return this.decodeArray(def, value)
            case TypeKind.Tuple:
                return this.decodeTuple(def, value)
            case TypeKind.Composite:
                return this.decodeComposite(def.fields, value)
            case TypeKind.Variant:
                return this.decodeVariant(def, value)
            case TypeKind.Option:
                return this.decodeOption(def.type, value)
            case TypeKind.BooleanOption:
                return this.decodeBooleanOption(value)
            case TypeKind.Bytes:
                return decodeHex(value)
            case TypeKind.BytesArray:
                return decodeBinaryArray(def.len, value)
            case TypeKind.DoNotConstruct:
                throw new Error('DoNotConstruct type reached')
            default:
                throw unexpectedCase((def as Type).kind)
        }
    }

    private decodeArray(def: ArrayType | SequenceType, value: unknown): any[] {
        assert(Array.isArray(value))
        let result: any[] = new Array(value.length)
        for (let i = 0; i < value.length; i++) {
            result[i] = this.decode(def.type, value[i])
        }
        return result
    }

    private decodeTuple(def: TupleType, value: unknown): any {
        let items = def.tuple
        switch(items.length) {
            case 0:
                assert(value == null)
                return null
            case 1:
                return this.decode(items[0], value)
            default:
                assert(Array.isArray(value))
                assert(value.length == items.length)
                let result: any[] = new Array(items.length)
                for (let i = 0; i < items.length; i++) {
                    result[i] = this.decode(items[i], value[i])
                }
                return result
        }
    }

    private decodeComposite(fields: Field[], value: any): any {
        if (fields.length == 0) {
            assert(value == null)
            return null
        } else if (fields[0].name == null) {
            return this.decodeCompositeTuple(fields, value)
        } else {
            return this.decodeObject(fields, value)
        }
    }

    private decodeObject(fields: Field[], value: any): any {
        assert(typeof value == 'object' && value != null)
        let result: any = {}
        for (let i = 0; i < fields.length; i++) {
            let f = fields[i]
            let name = assertNotNull(f.name)
            result[name] = this.decode(f.type, value[name])
        }
        return result
    }

    private decodeCompositeTuple(fields: Field[], value: unknown): any {
        switch(fields.length) {
            case 0:
                assert(value == null)
                return null
            case 1:
                assert(fields[0].name == null)
                return this.decode(fields[0].type, value)
            default:
                assert(Array.isArray(value))
                assert(value.length == fields.length)
                let result: any[] = new Array(fields.length)
                for (let i = 0; i < fields.length; i++) {
                    result[i] = this.decode(fields[i].type, value[i])
                }
                return result
        }
    }

    private decodeVariant(def: VariantType, value: any): any {
        assert(typeof value == 'object' && value != null)
        let result: any | undefined = undefined
        for (let key in value) {
            if (result != null) throw new Error('Ambiguous variant')
            let v = def.variantsByName![key]
            if (v == null) throw new Error(`Unknown variant ${key}`)
            if (v.fields.length == 0) return {
                __kind: key
            }
            if (v.fields[0].name == null) return {
                __kind: key,
                value: this.decodeCompositeTuple(v.fields, value[key])
            }
            result = this.decodeObject(v.fields, value[key])
            result.__kind = key
        }
        if (result == null) throw new Error('Empty variant object')
        return result
    }

    private decodeOption(type: Ti, value: unknown): any {
        return value == null ? undefined : this.decode(type, value)
    }

    private decodeBooleanOption(value: unknown): boolean | undefined {
        if (value == null) return undefined
        assert(typeof value == 'boolean')
        return value
    }

    private decodeCompact(type: Ti, value: unknown): number | BigInt {
        // TODO: more validation
        if (typeof value == 'string') {
            return BigInt(value)
        } else {
            assert(Number.isSafeInteger(value))
            return value as number
        }
    }
}


function decodePrimitive(type: Primitive, value: unknown): string | boolean | number | bigint {
    // TODO: more validation
    switch(type) {
        case 'I8':
        case 'U8':
        case 'I16':
        case 'U16':
        case 'I32':
        case 'U32':
            assert(Number.isSafeInteger(value))
            return value as number
        case 'I64':
        case 'U64':
        case 'I128':
        case 'U128':
        case 'I256':
        case 'U256':
            assert(typeof value == 'string' || typeof value == 'number')
            return BigInt(value)
        case 'Bool':
            assert(typeof value == 'boolean')
            return value
        case 'Str':
            assert(typeof value == 'string')
            return value
        default:
            throw unexpectedCase(type)
    }
}


function decodeHex(value: unknown): Buffer {
    assert(typeof value == 'string')
    assert(/^0x([a-fA-F0-9]{2})+$/.test(value))
    return Buffer.from(value.slice(2), 'hex')
}


function decodeBinaryArray(len: number, value: unknown): Uint8Array {
    assert(typeof value == 'string')
    if (/^0x([a-fA-F0-9]{2})+$/.test(value)) {
        assert(value.length - 2 == len * 2)
        return Buffer.from(value.slice(2), 'hex')
    } else {
        let bytes = ss58.decode(value).bytes
        assert(bytes.length == len, 'unexpected address length')
        return bytes
    }
}
