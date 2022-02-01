import assert from "assert"
import {
    ArrayType,
    BitSequenceType,
    DoNotConstructType,
    OptionType,
    Primitive,
    PrimitiveType,
    SequenceType,
    Ti,
    TupleType,
    Type,
    TypeKind,
    Variant
} from "./types"
import {assertNotNull, throwUnexpectedCase} from "./util"


export interface CodecStructType {
    kind: TypeKind.Struct
    fields: {name: string, type: Ti}[]
}


export interface CodecStructVariant {
    kind: 'struct'
    name: string
    def: CodecStructType
}


export interface CodecTupleVariant {
    kind: 'tuple'
    name: string
    def: TupleType
}


export interface CodecValueVariant {
    kind: 'value'
    name: string
    type: Ti
}


export interface CodecEmptyVariant {
    kind: 'empty'
    name: string
}


export type CodecVariant = CodecStructVariant | CodecTupleVariant | CodecValueVariant | CodecEmptyVariant


export interface CodecVariantType {
    kind: TypeKind.Variant
    variants: (CodecVariant | undefined)[]
}


export interface CodecBytesType {
    kind: TypeKind.Bytes
}


export interface CodecBytesArrayType {
    kind: TypeKind.BytesArray
    len: number
}


export interface CodecBooleanOptionType {
    kind: TypeKind.BooleanOption
}


export interface CodecCompactType {
    kind: TypeKind.Compact
    integer: Primitive
}


export type CodecType =
    PrimitiveType |
    SequenceType |
    BitSequenceType |
    ArrayType |
    TupleType |
    OptionType |
    DoNotConstructType |
    CodecCompactType |
    CodecStructType |
    CodecVariantType |
    CodecBytesType |
    CodecBytesArrayType |
    CodecBooleanOptionType


export function toCodecTypes(types: Type[]): CodecType[] {
    types = types.map(function unwrap(def: Type): Type {
        switch(def.kind) {
            case TypeKind.Tuple:
                if (def.tuple.length == 1) {
                    return unwrap(types[def.tuple[0]])
                } else {
                    return def
                }
            case TypeKind.Composite:
                if (def.fields[0]?.name == null) {
                    return unwrap({
                        kind: TypeKind.Tuple,
                        tuple: def.fields.map(t => {
                            assert(t.name == null)
                            return t.type
                        })
                    })
                } else {
                    return def
                }
            default:
                return def
        }
    })

    function isPrimitive(primitive: Primitive, ti: Ti): boolean {
        let type = types[ti]
        return type.kind == TypeKind.Primitive && type.primitive == primitive
    }

    return types.map((def, ti) => {
        switch(def.kind) {
            case TypeKind.Sequence:
                if (isPrimitive('U8', def.type)) {
                    return {kind: TypeKind.Bytes}
                } else {
                    return def
                }
            case TypeKind.Array:
                if (isPrimitive('U8', def.type)) {
                    return {kind: TypeKind.BytesArray, len: def.len}
                } else {
                    return def
                }
            case TypeKind.Option:
                if (isPrimitive('Bool', def.type)) {
                    return {kind: TypeKind.BooleanOption}
                } else {
                    return def
                }
            case TypeKind.Compact: {
                let type = types[def.type]
                switch(type.kind) {
                    case TypeKind.Tuple:
                        assert(type.tuple.length == 0)
                        return type
                    case TypeKind.Primitive:
                        assert(type.primitive[0] == 'U')
                        return {kind: TypeKind.Compact, integer: type.primitive}
                    default:
                        throwUnexpectedCase(type.kind)
                }
            }
            case TypeKind.Composite:
                return {
                    kind: TypeKind.Struct,
                    fields: def.fields.map(f => {
                        let name = assertNotNull(f.name)
                        return {name, type: f.type}
                    })
                }
            case TypeKind.Variant: {
                let variants = def.variants.filter(v => v != null) as Variant[]
                let uniqueIndexes = new Set(variants.map(v => v.index))
                if (uniqueIndexes.size != variants.length) {
                    throw new Error(`Variant type ${ti} has duplicate case indexes`)
                }
                let len = variants.reduce((len, v) => Math.max(len, v.index), 0) + 1
                let placedVariants: (CodecVariant | undefined)[] = new Array(len)
                variants.forEach(v => {
                    let cv: CodecVariant
                    if (v.fields[0]?.name == null) {
                        switch(v.fields.length) {
                            case 0:
                                cv = {kind: 'empty', name: v.name}
                                break
                            case 1:
                                cv = {kind: 'value', name: v.name, type: v.fields[0].type}
                                break
                            default:
                                cv = {
                                    kind: 'tuple',
                                    name: v.name,
                                    def: {
                                        kind: TypeKind.Tuple,
                                        tuple: v.fields.map(f => {
                                            assert(f.name == null)
                                            return f.type
                                        })
                                    }
                                }
                        }
                    } else {
                        cv = {
                            kind: 'struct',
                            name: v.name,
                            def: {
                                kind: TypeKind.Struct,
                                fields: v.fields.map(f => {
                                    let name = assertNotNull(f.name)
                                    return {name, type: f.type}
                                })
                            }
                        }
                    }
                    placedVariants[v.index] = cv
                })
                return {
                    kind: TypeKind.Variant,
                    variants: placedVariants
                }
            }
            default:
                return def
        }
    })
}
