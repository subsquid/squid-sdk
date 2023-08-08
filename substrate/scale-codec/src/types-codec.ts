import assert from 'assert'
import {
    ArrayType,
    BitSequenceType,
    BooleanOption,
    BytesArrayType,
    BytesType,
    DoNotConstructType,
    HexBytesArrayType,
    HexBytesType,
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
import {assertNotNull} from './util'


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


export interface CodecCompactType {
    kind: TypeKind.Compact
    integer: Primitive
}


export type CodecType =
    PrimitiveType |
    SequenceType |
    BitSequenceType |
    ArrayType |
    BytesType |
    BytesArrayType |
    HexBytesType |
    HexBytesArrayType |
    TupleType |
    OptionType |
    BooleanOption |
    DoNotConstructType |
    CodecCompactType |
    CodecStructType |
    CodecVariantType


export function getCodecType(types: Type[], ti: Ti): CodecType {
    let def = types[ti]
    switch(def.kind) {
        case TypeKind.Compact: {
            let compact = types[def.type]
            assert(compact.kind == TypeKind.Primitive)
            assert(compact.primitive[0] == 'U')
            return {kind: TypeKind.Compact, integer: compact.primitive}
        }
        case TypeKind.Composite:
            if (def.fields.length == 0 || def.fields[0].name == null) {
                return {
                    kind: TypeKind.Tuple,
                    tuple: def.fields.map(f => {
                        assert(f.name == null)
                        return f.type
                    })
                }
            } else {
                return {
                    kind: TypeKind.Struct,
                    fields: def.fields.map(f => {
                        let name = assertNotNull(f.name)
                        return {name, type: f.type}
                    })
                }
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


export function toCodecTypes(types: Type[]): CodecType[] {
    let codecTypes: CodecType[] = new Array(types.length)
    for (let i = 0; i < types.length; i++) {
        codecTypes[i] = getCodecType(types, i)
    }
    return codecTypes
}
