import assert from 'assert'
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
} from './types'
import {assertNotNull, throwUnexpectedCase} from './util'


export interface CodecStructType {
    kind: TypeKind.Struct
    fields: {name: string, type: Ti}[]
}


export interface CodecStructVariant {
    kind: 'struct'
    name: string
    index: number
    def: CodecStructType
}


export interface CodecTupleVariant {
    kind: 'tuple'
    name: string
    index: number
    def: TupleType
}


export interface CodecValueVariant {
    kind: 'value'
    name: string
    index: number
    type: Ti
}


export interface CodecEmptyVariant {
    kind: 'empty'
    name: string
    index: number
}


export type CodecVariant = CodecStructVariant | CodecTupleVariant | CodecValueVariant | CodecEmptyVariant


export interface CodecVariantType {
    kind: TypeKind.Variant
    variants: (CodecVariant | undefined)[]
    variantsByName: Record<string, CodecVariant>
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


export function getUnwrappedType(types: Type[], ti: Ti): Type {
    let def = types[ti]
    switch(def.kind) {
        case TypeKind.Tuple:
        case TypeKind.Composite:
            return unwrap(def, types)
        default:
            return def
    }
}


function unwrap(def: Type, types: Type[], visited?: Set<Ti>): Type {
    let next: Ti
    switch(def.kind) {
        case TypeKind.Tuple:
            if (def.tuple.length == 1) {
                next = def.tuple[0]
                break
            } else {
                return def
            }
        case TypeKind.Composite:
            if (def.fields[0]?.name == null) {
                let tuple = def.fields.map(t => {
                    assert(t.name == null)
                    return t.type
                })
                if (tuple.length == 1) {
                    next = tuple[0]
                    break
                } else {
                    return {
                        kind: TypeKind.Tuple,
                        tuple
                    }
                }
            } else {
                return def
            }
        default:
            return def
    }
    if (visited?.has(next)) {
        throw new Error(`Cycle of tuples involving ${next}`)
    }
    visited = visited || new Set()
    visited.add(next)
    return unwrap(types[next], types, visited)
}


export function getCodecType(types: Type[], ti: Ti): CodecType {
    let def = getUnwrappedType(types, ti)
    switch(def.kind) {
        case TypeKind.Sequence:
            if (isPrimitive('U8', types, def.type)) {
                return {kind: TypeKind.Bytes}
            } else {
                return def
            }
        case TypeKind.Array:
            if (isPrimitive('U8', types, def.type)) {
                return {kind: TypeKind.BytesArray, len: def.len}
            } else {
                return def
            }
        // https://github.com/substrate-developer-hub/substrate-docs/issues/1061
        // case TypeKind.Option:
        //     if (isPrimitive('Bool', types, def.type)) {
        //         return {kind: TypeKind.BooleanOption}
        //     } else {
        //         return def
        //     }
        case TypeKind.Compact: {
            let type = getUnwrappedType(types, def.type)
            switch(type.kind) {
                case TypeKind.Tuple:
                    assert(type.tuple.length == 0)
                    return type
                case TypeKind.Primitive:
                    assert(type.primitive[0] == 'U')
                    return {kind: TypeKind.Compact, integer: type.primitive}
                case TypeKind.Composite: {
                    assert(type.fields.length == 1)
                    let num = getUnwrappedType(types, type.fields[0].type)
                    // FIXME: as far as I understand, CompactAs chain can be arbitrary long
                    assert(num.kind == TypeKind.Primitive)
                    assert(num.primitive[0] == 'U')
                    return {kind: TypeKind.Compact, integer: num.primitive}
                }
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
            let variantsByName: Record<string, CodecVariant> = {}
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
                            cv = {kind: 'empty', name: v.name, index: v.index}
                            break
                        case 1:
                            cv = {kind: 'value', name: v.name, index: v.index, type: v.fields[0].type}
                            break
                        default:
                            cv = {
                                kind: 'tuple',
                                name: v.name,
                                index: v.index,
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
                        index: v.index,
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
                variantsByName[cv.name] = cv
            })
            return {
                kind: TypeKind.Variant,
                variants: placedVariants,
                variantsByName
            }
        }
        default:
            return def
    }
}


function isPrimitive(primitive: Primitive, types: Type[], ti: Ti): boolean {
    let type = getUnwrappedType(types, ti)
    return type.kind == TypeKind.Primitive && type.primitive == primitive
}


export function toCodecTypes(types: Type[]): CodecType[] {
    let codecTypes: CodecType[] = new Array(types.length)
    for (let i = 0; i < types.length; i++) {
        codecTypes[i] = getCodecType(types, i)
    }
    return codecTypes
}
