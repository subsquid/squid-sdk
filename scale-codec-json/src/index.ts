import {ArrayType, Codec as ScaleCodec, SequenceType, Ti, TupleType, Type, TypeKind} from "@subsquid/scale-codec"
import {CodecStructType} from "@subsquid/scale-codec/lib/types-codec"
import {throwUnexpectedCase} from "@subsquid/scale-codec/lib/util"
import {decodeHex} from "@subsquid/util-internal-hex"
import assert from "assert"
import {JsonType, JsonVariantType, toJsonTypes} from "./types"
import {decodeBinaryArray, decodeCompact, decodePrimitive, encodeUnsignedInt} from "./util"


export class Codec {
    private types: JsonType[]
    private scaleCodec: ScaleCodec

    constructor(types: Type[]) {
        this.types = toJsonTypes(types)
        this.scaleCodec = new ScaleCodec(types)
    }

    decode(type: Ti, value: unknown): any {
        let def = this.types[type]
        switch(def.kind) {
            case TypeKind.Primitive:
                return decodePrimitive(def.primitive, value)
            case TypeKind.Compact:
                return decodeCompact(def.integer, value)
            case TypeKind.BitSequence:
                return decodeHex(value as string)
            case TypeKind.Array:
                return this.decodeArray(type, def, value)
            case TypeKind.Sequence:
                return this.decodeSequence(def, value)
            case TypeKind.Tuple:
                return this.decodeTuple(def, value)
            case TypeKind.Struct:
                return this.decodeStruct(def, value)
            case TypeKind.Variant:
                return this.decodeVariant(def, value)
            case TypeKind.Option:
                return this.decodeOption(def.type, value)
            case TypeKind.BooleanOption:
                return this.decodeBooleanOption(value)
            case TypeKind.Bytes:
                return decodeHex(value as string)
            case TypeKind.BytesArray:
                return decodeBinaryArray(def.len, value)
            case TypeKind.DoNotConstruct:
                throw new Error('DoNotConstruct type reached')
            default:
                throwUnexpectedCase((def as Type).kind)
        }
    }

    private decodeArray(ti: Ti, def: ArrayType, value: unknown): any[] {
        if (Array.isArray(value)) {
            assert(value.length == def.len)
            let result: any[] = new Array(value.length)
            for (let i = 0; i < value.length; i++) {
                result[i] = this.decode(def.type, value[i])
            }
            return result
        } else {
            // For some reasons, polkadot can encode values
            // for which we get type [u64; 4] as a single u256 number.
            // This branch is for that case.
            assert(typeof value == 'string' || typeof value == 'number')
            let n = BigInt(value)
            let itemType = this.types[def.type]
            assert(itemType.kind == TypeKind.Primitive && itemType.primitive[0] == 'U')
            let totalLength = def.len * Number.parseInt(itemType.primitive.slice(1)) / 8
            let binary = encodeUnsignedInt(totalLength, n)
            return this.scaleCodec.decodeBinary(ti, binary)
        }
    }

    private decodeSequence(def: SequenceType, value: unknown): any[] {
        assert(Array.isArray(value))
        let result: any[] = new Array(value.length)
        for (let i = 0; i < value.length; i++) {
            result[i] = this.decode(def.type, value[i])
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
        assert(typeof value == 'object' && value != null)
        let result: any = {}
        for (let i = 0; i < def.fields.length; i++) {
            let f = def.fields[i]
            result[f.name] = this.decode(f.type, value[f.name])
        }
        return result
    }

    private decodeVariant(def: JsonVariantType, value: any): any {
        if (typeof value == 'string') {
            if (def.variantNames == null) {
                throw new Error(`Variant type which has variants with arguments can't be encoded as string`)
            }
            if (def.variantNames[value]) return {__kind: value}
            throw new Error(`Unknown variant: ${value}`)
        }
        assert(typeof value == 'object' && value != null)
        let result: any | undefined = undefined
        for (let key in value) {
            if (result != null) throw new Error('Ambiguous variant')
            let v = def.variantsByPropName[key.toLowerCase()]
            if (v == null) throw new Error(`Unknown variant ${key}`)
            switch(v.kind) {
                case 'struct':
                    result = this.decodeStruct(v.def, value[key])
                    result.__kind = v.name
                    break
                case 'tuple':
                    result = {
                        __kind: v.name,
                        value: this.decodeTuple(v.def, value[key])
                    }
                    break
                case 'value':
                    result = {
                        __kind: v.name,
                        value: this.decode(v.type, value[key])
                    }
                    break
                case 'empty':
                    result = {__kind: v.name}
                    break
                default:
                    throwUnexpectedCase()
            }
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
}
