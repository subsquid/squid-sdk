import {
    ArrayType,
    Field,
    SequenceType,
    Ti,
    TupleType,
    Type,
    TypeKind,
    Variant,
    VariantType
} from "@subsquid/scale-codec"
import {assertNotNull, normalizeTypes, unexpectedCase} from "@subsquid/scale-codec/lib/util"
import assert from "assert"
import {decodeBinaryArray, decodeHex, decodePrimitive} from "./util"


export class Codec {
    private types: Type[]

    constructor(types: Type[]) {
        this.types = normalizeTypes(types)
        indexVariantNames(this.types)
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
                assert(value == null || Array.isArray(value) && value.length == 0)
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
            let v = def.variantsByJsonPropName![key.toLowerCase()]
            if (v == null) throw new Error(`Unknown variant ${key}`)
            if (v.fields.length == 0) return {
                __kind: v.name
            }
            if (v.fields[0].name == null) return {
                __kind: v.name,
                value: this.decodeCompositeTuple(v.fields, value[key])
            }
            result = this.decodeObject(v.fields, value[key])
            result.__kind = v.name
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


function indexVariantNames(types: Type[]): void {
    types.forEach(type => {
        if (type.kind !== TypeKind.Variant) return
        let variantsByJsonPropName: Record<string, Variant> = Object.create(null)
        let names: Record<string, boolean> = Object.create(null)
        let hasNoFields = true
        type.variants.forEach(v => {
            if (v == null) return
            names[v.name] = true
            variantsByJsonPropName[v.name.toLowerCase()] = v
            if (v.fields.length > 0) {
                hasNoFields = false
            }
        })
        if (Object.keys(variantsByJsonPropName).length != Object.keys(names).length) {
            throw new Error(`
Variant type with variants ${JSON.stringify(Object.keys(names))} can't be reliably decoded,
because of a clash between lower cased variant names.
            `.trim())
        }
        type.variantsByJsonPropName = variantsByJsonPropName
        if (hasNoFields) {
            type.variantNames = names
        }
    })
}
