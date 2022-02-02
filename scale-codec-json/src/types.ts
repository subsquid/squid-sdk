import {
    ArrayType,
    BitSequenceType,
    DoNotConstructType,
    OptionType,
    PrimitiveType,
    SequenceType,
    TupleType,
    Type,
    TypeKind
} from "@subsquid/scale-codec"
import {
    CodecBooleanOptionType,
    CodecBytesArrayType,
    CodecBytesType,
    CodecCompactType,
    CodecStructType,
    CodecVariant,
    CodecVariantType,
    toCodecTypes
} from "@subsquid/scale-codec/lib/types-codec"


export interface JsonVariantType {
    kind: TypeKind.Variant
    variantsByPropName: Record<string, CodecVariant>
    variantNames?: Record<string, boolean>
}


export type JsonType =
    PrimitiveType |
    SequenceType |
    BitSequenceType |
    ArrayType |
    TupleType |
    OptionType |
    DoNotConstructType |
    CodecCompactType |
    CodecStructType |
    CodecBytesType |
    CodecBytesArrayType |
    CodecBooleanOptionType |
    JsonVariantType


export function toJsonTypes(types: Type[]): JsonType[] {
    return toCodecTypes(types).map(type => {
        switch(type.kind) {
            case TypeKind.Variant:
                return toJsonVariantType(type)
            default:
                return type
        }
    })
}


export function toJsonVariantType(type: CodecVariantType): JsonVariantType {
    let byProp: Record<string, CodecVariant> = Object.create(null)
    let names: Record<string, boolean> = Object.create(null)
    let hasNoFields = true
    type.variants.forEach(v => {
        if (v == null) return
        names[v.name] = true
        byProp[v.name.toLowerCase()] = v
        if (v.kind != 'empty') {
            hasNoFields = false
        }
    })
    if (Object.keys(byProp).length != Object.keys(names).length) {
        throw new Error(`
Variant type with variants ${JSON.stringify(Object.keys(names))} can't be reliably decoded,
because of a clash between lower cased variant names.
            `.trim())
    }
    return {
        kind: TypeKind.Variant,
        variantsByPropName: byProp,
        variantNames: hasNoFields ? names : undefined
    }
}
